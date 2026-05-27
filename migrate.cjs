const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'createjs-source.js');
const outputFile = path.join(__dirname, 'createjs-clean.ts');

try {
	let code = fs.readFileSync(sourceFile, 'utf8');
	console.log("Processing source file and neutralizing TS2339 errors...");

	// Step 0: Convert the global var assignment into an exported namespace block
	code = code.replace(/^var\s+createjs\s*=\s*\{\}\s*;?/m, 'export namespace createjs {');

	// Step 0.5: Append a dynamic index signature directly inside the namespace boundary
	code = code.replace(
		'export namespace createjs {',
		'export namespace createjs {\n\t[key: string]: any;\n'
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
				propertyDeclarations += `\t${prop}: any;\n`;
			});

			// Reconstruct the block with the properties declared at the top of the class frame
			if (propertyDeclarations) {
				return match.replace(' {', ` {\n${propertyDeclarations}`);
			}
			return match;
		}
	);

	// 3. Convert prototype method declarations to modern ES6 class methods
	code = code.replace(
		/^[\t ]*p\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm,
		'\t$1($2) {'
	);

	// 4. Strip out residual structural macros that are no longer needed
	code = code.replace(/^[\t ]*createjs\.extend\([^)]+\);?/gm, '');

	// 5. Clean up old global namespace attachment assignments at the bottom of blocks
	code = code.replace(/^[\t ]*createjs\.([A-Za-z0-9_]+)\s*=\s*\1\s*;?/gm, '');

	// 6. Close the ES6 class definition blocks before the IIFE wrapper closes
	code = code.replace(/^[\t ]*\/\/\s*\}\(\)\);/gm, '}\n// }());');

	// 7. Convert legacy static method assignments to modern trailing definitions
	code = code.replace(
		/^([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm,
		'$1.$2 = function($3) {'
	);

	// 8. Insert the closing namespace bracket directly in front of the final export line
	code = code.replace(
		/^(if\(typeof module !== "undefined"[\s\S]*?module\.exports\s*=\s*this\.createjs;?)/m,
		'}\n$1'
	);

	fs.writeFileSync(outputFile, code, 'utf8');
	console.log("Refactoring complete! Output saved to: createjs-clean.ts");

} catch (error) {
	console.error("An error occurred during migration processing:", error.message);
}
