#!/usr/bin/env node
const argv = require('yargs')
  .demandOption(['gh-token', 'owner', 'repo', 'release-branch', 'env', 'tag'])
  .option('gh-approval-token', {
    description: 'gh token to auto approve the opened pull request',
    type: 'string'
  })
  .option('infrastructure-path', {
    description: 'infrastructure path',
    type: 'string',
    default: 'livingdocs'
  })
  .help(false)
  .version(false)
  .argv
const run = require('./index')

run(argv)
  .then((pullRequest) => {
    console.log(`
        The PR for the infrastructure bump has been opened at
        ${pullRequest.html_url}
      `)
  })
  .catch((e) => {
    console.log(e.message)
    // delete branch
    process.exit(1)
  })
