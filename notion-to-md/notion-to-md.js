const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require('fs');

// Pass in notion page id, output directory, and output name as a command line argument
// i.e. node notion-to-md.js 082ae7114ae54fc88066829602f32f2b ../docs/ on-prem-docs

// Ensure the notion page passed in is connected to a notion integration 
// Copy and paste the integration secret api key here
const notionKey = "your integration secret";
var args = process.argv.slice(2);

console.log("Passed in args: " + args + "\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

if (args.length < 3) {
    console.log("ERROR: Pass in the id of notion page, output directory, and output name i.e. node notion-to-md.js 082ae7114ae54fc88066829602f32f2b ../docs/ on-prem-docs");
    return;
} 

const page_id = args[0];
const output_dir = args[1];
const output_name = args[2];

try {
  fs.lstatSync(output_dir).isDirectory();
} catch (e) {
  console.log(`ERROR: Directory ./${output_dir} does not exist`);
  return;
}

const notion = new Client({
  auth: notionKey,
});

// passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });



(async () => {
  const mdblocks = await n2m.pageToMarkdown(page_id);
  const mdString = n2m.toMarkdownString(mdblocks).parent;
  const output_path = output_dir + "/" + output_name + '.md'
  fs.writeFile(output_path, mdString, (err) => {
  
      // In case of a error throw err.
      if (err) throw err
      else console.log("Successfully saved .md file: " + output_path);
  })
})();

