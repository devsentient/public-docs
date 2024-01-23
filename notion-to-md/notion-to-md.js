const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require('fs');
const readline = require('readline');

// Pass in file of notion page ids
// i.e. node notion-to-md.js notion_pages.in
// Pass second argument to store output in a spearate path (default is current)

const notionKey = "secret_Jum3rGSo5AkM5yscH62uw5kXdIENNh0mdmYLuG2QnYd";
var args = process.argv.slice(2);

console.log("Passed in args: " + args);

if (args.length == 0) {
    console.log("ERROR: Pass in file of notion page ids as arg i.e. node notion-to-md.js notion_pages.in");
    return;
} 

const notion_ids_file = args[0];

if (!fs.existsSync(args[0])) {
    console.log(`ERROR: File ./${notion_ids_file} does not exist`);
    return;
}

const notion = new Client({
  auth: notionKey,
});

// passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

async function processLineByLine() {
    const fileStream = fs.createReadStream(notion_ids_file);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
  
    for await (const line of rl) {
      let current_id = line;

      (async () => {
        const mdblocks = await n2m.pageToMarkdown(current_id);
        const mdString = n2m.toMarkdownString(mdblocks).parent;
        const output_file = (args.length >= 2 && fs.existsSync(args[1]) ? args[1] + "/" : "") + current_id + '.md'
        fs.writeFile(output_file, mdString, (err) => {
        
            // In case of a error throw err.
            if (err) throw err;
        })
      })();
    }
}

processLineByLine()
