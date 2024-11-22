#!/usr/bin/env node
const argv = require('yargs')
  .demandOption(['gh-token', 'owner', 'repo', 'releaseBranch', 'env', 'downstreamTag'])
  .option('gh-approval-token', {
    description: 'gh token to auto approve the opened pull request',
    type: 'string'
  })
  .option('customer', {
    description: 'customer name',
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

// node cli.js  --owner livingdocsIO --repo infrastructure-onboarding-service \
// --infrastructure-path onboarding-service --releaseBranch release-2024-11-16 --env stage \
// --downstream-tag v4.20.11 --customer onboarding \
// --gh-token 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
