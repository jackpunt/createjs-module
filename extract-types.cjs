const { Project } = require("ts-morph");
const path = require("path");
const fs = require("fs");

// 1. Initialize project with allowJs and checkJs turned ON
const project = new Project({
    compilerOptions: {
        target: 99, // ESNext
        allowJs: true,
        checkJs: true,
        declaration: true,
        emitDeclarationOnly: true,
        outDir: path.join(__dirname, "types")
    }
});

// 2. Read your file contents
const tsFilePath = path.join(__dirname, "createjs-source.ts");
let code = fs.readFileSync(tsFilePath, "utf8");

/* * 3. The Fix: We temporarily strip 'export namespace createjs {' and '}' 
 * because namespaces are illegal in .js files, and change the extension 
 * to .js so the compiler is forced to use its JSDoc type-inference engine.
 */
code = code.replace(/export\s+namespace\s+createjs\s*\{/, "");
code = code.replace(/\}\s*$/, ""); // Strips the very last closing brace

// Create the virtual JavaScript source file inside the compiler memory
const virtualJsFile = project.createSourceFile("createjs.js", code);

// 4. Extract the emit payload stream
const emitOutput = virtualJsFile.getEmitOutput();

if (emitOutput.getEmitSkipped()) {
    console.error("Emit skipped. Checking internal compiler bugs...");
    const diagnostics = project.getPreEmitDiagnostics();
    for (const diag of diagnostics) {
        console.error(`-> ${diag.getMessageText()}`);
    }
} else {
    // 5. Write the newly typed file to disk
    for (const outputFile of emitOutput.getOutputFiles()) {
        let filePath = outputFile.getFilePath();
        let content = outputFile.getText();
        
        // Wrap the output back into the namespace envelope so your project can read it
        content = `declare namespace createjs {\n${content}\n}`;
        
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, "utf8");
				// fs.unlinkSync(path.join(__dirname, "createjs-temp.js"));
        console.log(`Success! Strongly-typed definition file generated at: ${filePath}`);
    }
}
