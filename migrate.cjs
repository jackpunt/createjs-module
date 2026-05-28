const fs = require('fs');
const path = require('path');

// process.argv[0] is node, process.argv[1] is the script path, process.argv[2] is our file argument
const inputFile = process.argv[2] ?? 'createjs-source';

const sourceFile = path.join(__dirname, `${inputFile}.js`);
const outputFile = path.join(__dirname, `${inputFile}.ts`);

try {
	let code = fs.readFileSync(sourceFile, 'utf8');
	console.log("Processing source file and neutralizing TS2339 errors...");

	// Step 0: Convert the global var assignment into an exported namespace block
	code = code.replace(/^var\s+createjs\s*=\s*\{\}\s*;?/m, `// ${new Date()}\nexport namespace createjs {`);

  // Step 0.5: Scan the file for sub-modules and declare their classes at the top
	// Catches: createjs.EaselJS = createjs.EaselJS || {};
	const subClasses = new Set();
	const subClassRegex = /createjs\.([A-Za-z0-9_]+)\s*=\s*createjs\.\1/g;
	let subClassMatch;

	while ((subClassMatch = subClassRegex.exec(code)) !== null) {
		subClasses.add(subClassMatch[1]);
	}

	let classDeclarations = '\n';
	subClasses.forEach(className => {
		classDeclarations += `\texport class ${className} {} // 0.5\n`;
	});

	// Inject all classes cleanly at the very top of the namespace block
	code = code.replace(
		'export namespace createjs {',
		`export namespace createjs {${classDeclarations}`
	);

	// 1. Remove prototype variable alias boilerplate: var p = ClassName.prototype;
	code = code.replace(/^[\t ]*var\s+p\s*=\s*([A-Za-z0-9_]+)\.prototype\s*;?/gm, '');
  
	// 2. Map and inject inheritance hooks by looking ahead for createjs.extend macros
	code = code.replace(
		/^export\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/gm,
		(match, className, args) => {
			const extendRegex = new RegExp(`createjs\\.extend\\(${className},\\s*([A-Za-z0-9_]+)\\)`);
			const hasParent = code.match(extendRegex);
			
			if (hasParent) {
				const parentClassName = hasParent[1];
				return `export class ${className} extends ${parentClassName} {\n\tconstructor(${args}) {`;
			}
			return `export class ${className} {\n\tconstructor(${args}) {`;
		}
	);

	// NEW STEP 2.5: WIPE OUT TS2339 ERRORS
	// Harvests all "this.propertyName =" expressions inside constructors and declares them at the top of classes
	code = code.replace(
		/export class ([A-Za-z0-9_]+)(?: extends [A-Za-z0-9_]+)? \{\s*constructor\(([^)]*)\) \{([\s\S]*?)(?=\t\w+\(.*\) \{|var p =|\/\/ \}\(\)\);)/g,
		(match, className, args, constructorBody) => {
			// Find all distinct property assignments inside this specific constructor block
			const propertyMatches = constructorBody.matchAll(/this\.([A-Za-z0-9_]+)\s*=/g);
			const uniqueProperties = new Set();
			
			for (const propMatch of propertyMatches) {
				uniqueProperties.add(propMatch[1]);
			}

			// Generate explicit 'any' class property definitions
			let propertyDeclarations = '';
			uniqueProperties.forEach(prop => {
				propertyDeclarations += `\tdeclare ${prop}; // 2.5\n`;
			});

			// Reconstruct the block with the properties declared at the top of the class frame
			if (propertyDeclarations) {
				return match.replace(' {', ` {\n${propertyDeclarations}`);
			}
			return match;
		}
	);

  // 2.7. Scan for dynamic event properties and inject them into class Event
	// Must run AFTER Step 2 converts constructors to classes!
	const eventProperties = new Set();
	const eventPropRegex = /\bevent\.([a-z0-9_]+)\s*=/gi;
	let eventMatch;

	while ((eventMatch = eventPropRegex.exec(code)) !== null) {
		if (eventMatch[1] !== 'toString' && eventMatch[1] !== 'clone') {
			eventProperties.add(eventMatch[1]);
		}
	}

	let eventDeclarations = '';
	eventProperties.forEach(prop => {
		eventDeclarations += `\tdeclare ${prop}; // 2.7\n`;
	});

	// Diagnostic Log Output to terminal
	// console.log(`\n--- [Diagnostic] Found ${eventProperties.size} Event Properties ---`);
	// console.log(eventDeclarations || "\t(No properties matched)");
	// console.log("------------------------------------------------\n");

	// Inject the properties right at the top of the Event class body
	code = code.replace(
		/(export class Event(?:\s+extends\s+[A-Za-z0-9_]+)?\s*\{)/g,
		`$1\n${eventDeclarations}`
	);

  // 2.9 declare 'parent' for EventDispatcher
  code = code.replace(
    /(class EventDispatcher {)/, '$1\n\tdeclare parent: any; // 2.9'
  )

	// 3. Convert prototype method declarations to modern ES6 class methods
	code = code.replace(
		/^[\t ]*p\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm,
		'\t$1($2) { // 3.0'
	);

  // 3.5. Convert prototype shortcut method aliases to ES6 class properties
	// Finds: p.off = p.removeEventListener;
	// Converts to: off = this.removeEventListener;
	code = code.replace(
		/^[\t ]*p\.([A-Za-z0-9_]+)\s*=\s*p\.([A-Za-z0-9_]+)\s*;?/gm,
		'\t$1 = this.$2; //3.5'
	);

	// 4. Strip out residual structural macros that are no longer needed
	code = code.replace(/^[\t ]*createjs\.extend\([^)]+\);?/gm, '');

	// 5. Clean up old global namespace attachment assignments at the bottom of blocks
	code = code.replace(/^[\t ]*createjs\.([A-Za-z0-9_]+)\s*=\s*\1\s*;?/gm, '');

	// 6. Close the ES6 class definition blocks before the IIFE wrapper closes
	code = code.replace(/^[\t ]*\/\/\s*\}\(\)\);/gm, '}\n// }());');

	// 7.0 Convert legacy static method assignments to modern trailing definitions for namespace createjs
	code = code.replace(
		/^(\s*)(createjs)\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm,
		'$1export function $3($4) { // 7.0'
	);

	// 7.1 Convert Classname.method = function() to static method(); when Classname is NOT createjs
	code = code.replace(
		/^\s*(?!createjs)([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm,
		'  static $2($3) { // 7.1'
	);

  // 7.2 Fix EventDispatcher.initialize(target)
  code = code.replace(
    'initialize(target) {', 'initialize(target, p = EventDispatcher.prototype) { // 7.2'
  );

  // 7.5. Convert legacy static property assignments to modern trailing assignments
	// Finds: EventDispatcher.someProperty = true;  or  EventDispatcher.DEFAULT_TIMEOUT = 1000;
	// Converts to: EventDispatcher.someProperty = true; (ensuring it bypasses structural parsing blocks)
  // Leave createjs.item or this.item or o.item as given
	code = code.replace(
		/^(\t|  )([A-Z][A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*=\s*(?!function)([^;]+);/gm,
		'\tstatic $3 = $4; // 7.5'
	);

  // 7.6a. Capture single lines starting with createjs., preserving trailing comments
	// Finds: \tcreatejs.EventDispatcher.initialize(Ticker); // inject EventDispatcher methods.
	// Converts to: \tstatic { createjs.EventDispatcher.initialize(Ticker); } // inject EventDispatcher methods.
	code = code.replace(
		/^\t(createjs\.[A-Za-z0-9_.]+\([^)]*\);?)(.*)$/gm,
		'\tstatic { $1 }$2 // 7.6a'
	);

	// 7.6b. Capture 'try {' blocks starting with a tab, up to the next empty line
	// Finds: \ttry { ... \n\t} catch(e) {} down to an empty line hook
	// Converts to: \tstatic {\n\ttry { ... \n\t}\n\t}
	code = code.replace(
		/(^\ttry\s*\{[\s\S]*?)(?=\n\s*\n)/gm,
		(match) => {
			return `\tstatic {\n\t${match.trim().replace(/\n/g, '\n\t')} // 7.6b\n\t}`;
		}
	);

  // 7.9 Arcane wrap window.xxx(Cancel|Request)AnimattionFrame with (window as any).xxxCancel...
  code = code.replace(
    /\|\| window\.([a-z]*(Cancel|Request)AnimationFrame[ ;])/g, '|| (window as any).$1'
  );
  code = code.replace(
    /\|\| w\.performance\./g, '|| (w as any).'
  );

	// 8. Insert the closing namespace bracket directly in front of the final export line
	code = code.replace(
		/^(if\(typeof module !== "undefined"[\s\S]*?module\.exports\s*=\s*this\.createjs;?)/m,
		'}// 8.0\n$1'
	);

  // 9. Tweak js for ts typing; one place in EventDispatcher.dispatchEvent
  code = code.replace('1+(i==0)', '1+(i==0?1:0)');

  // 10. declare statics for class EaselJS
  code = code.replace('class EaselJS {}', `class EaselJS {
    static version: string;
    static buildDate: string;
  }`)
  code = code.replace('createjs.EaselJS || {};', `createjs.EaselJS || {} as typeof EaselJS;`)
  code = code.replace('module.exports = this.createjs', `module.exports = createjs`)

	fs.writeFileSync(outputFile, code, 'utf8');
	console.log(`Refactoring complete! Output saved to: ${outputFile}`);

} catch (error) {
	console.error("An error occurred during migration processing:", error.message);
}
