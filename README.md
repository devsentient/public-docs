# Overview
[Public documentation page](https://docs.hyperplane.dev/public-docs/) to guide users in deploying the Shakudo Platform. Uses [docsify](https://github.com/docsifyjs/docsify/) to generate the page. 

# Adding additional documentation
1. Clone this repository
1. Since we maintain most of our existing documentation on notion, we can directly export any notion page in the markdown format:
    <img width="243" alt="image" src="https://github.com/devsentient/public-docs/assets/155983994/003eeb38-88a3-4839-becf-bb03c49e41b5">

    1. Make sure to check the *Include Subpages* option if the page includes any direct links to other notion pages:
    <img width="315" alt="image" src="https://github.com/devsentient/public-docs/assets/155983994/73c9c56d-3cf1-4e8f-9dff-72de4e7a067c">

1. Once downloaded, unzip the file to get the markdown file
    1. If there are subpages, their markdown files will also be downloaded
    1. If there are any local content (i.e. images), they will be downloaded in a folder in the same directory level as the page in which it was used in.
1. Copy the markdown file of the desired page into the `./docs` directory (or in a sub directory for organization i.e. `./docs/Deployment`
 for deployment docs)
1. Then add the page to `./docs/_sidebar.md`. For example:
    <img width="722" alt="image" src="https://github.com/devsentient/public-docs/assets/155983994/0be0a03a-8ece-4828-8c79-f59f0ff22bf9">

    where [] specifies the sidebar name, the first parameter in () specifies the filepath from the the root `./docs` to the markdown file, and the second parameter in () is an optional title for the browser tab:

    <img width="288" alt="image" src="https://github.com/devsentient/public-docs/assets/155983994/74138bcb-6303-4282-8eca-514da8ce3110">

   

   <img width="321" alt="image" src="https://github.com/devsentient/public-docs/assets/155983994/b1e88a99-cf1b-402d-84f3-ad0b1203a127">
1. If the page has links to other notion pages or uses local files/images, then they must be added manually and the links in the markdown file must be updated.
    1. For child markdown pages
        1. Add them to the `./docs` directory the same way as above.
        1. Ensure the parent page's markdown file links to these child pages from the root directory `./docs`.
    1. For local files/images:
        1. Place them anywhere in the `./docs` directory i.e. `./docs/Deployment/images` for images used by deployment pages.
        1. Ensure that the page that uses local content uses the link to these files/images relative to where the current page lies i.e. a markdown file in `./docs/Deployment` may want to use images by referencing `images/some_picture.png` which has an absolute path of `./docs/Deployment/images/some_picture.png`
1. Upon merge to the main branch, any changes should be reflected within a few minutes and displayed on (the page)[https://docs.hyperplane.dev/public-docs]
1. The notion export to markdown is not perfect and may contain formatting issues so make sure to fix these issues and/or edit the resulting markdown file.

# Testing Locally
Follow the steps on the (docsify docs)[https://docsify.js.org/#/quickstart] to serve and test the page locally.
