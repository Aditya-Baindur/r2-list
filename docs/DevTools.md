# Devtools


In most of my projects, I usually write custom scripts to make developing much easier. 

In this project, I have in the package.json added preetier : 


| col1 | col2 | col3 |
| ---- | ---- | ---- |
|      |      |      |
|      |      |      |


"deploy": "wrangler deploy",

"dev": "wrangler dev",

"start": "wrangler dev",

"test": "vitest",

"cf-typegen": "wrangler types",

"format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,html,css,md}\""


A custom cdn.sh script which can be used by running `source cdn.sh` and you can use the following commands in your terminal :


| Command | Purpose                                       |
| ------- | --------------------------------------------- |
| d       | Runs pnpm run deploy                         |
| hp      | Deploys the HTML code needed to the R2 bucket |
