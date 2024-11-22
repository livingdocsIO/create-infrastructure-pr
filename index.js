const semver = require('semver')
const gitGetContent = require('./git/get-content')
const gitGetShaBranch = require('./git/get-sha-branch')
const gitCreateBranch = require('./git/create-branch')
const createTree = require('./git/create-tree')
const createCommit = require('./git/create-commit')
const createBlob = require('./git/create-blob')
const updateRef = require('./git/update-ref')
const createPullRequest = require('./git/create-pull-request')
const createApprovalForPullRequest = require('./git/create-approval-for-pull-request')

async function updateYamlFile ({owner, repo, token, path, tag}) {
  const base64Obj = await gitGetContent({owner, repo, token, path})
  if (base64Obj) {
    const content = Buffer.from(base64Obj.content, 'base64').toString()
    const updatedContent = content.replace(/range: ".*"/, `range: "${tag}"`)
    const contentUpdate = Buffer.from(updatedContent).toString('base64')
    const blob = await createBlob({owner, repo, token, content: contentUpdate})
    return {
      path: base64Obj.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    }
  }
  return null
}

function getFilePath ({infrastructurePath, env, type}) {
  return `apps/${infrastructurePath}/${env}/flux/image-${infrastructurePath}-${type}.yaml`
}

function getTag ({tag, env}) {
  if (env === 'prod') {
    return semver.coerce(tag).toString() // `v4.20.11` -> `4.20.11`
  }
  return semver.coerce(tag).toString().replace(/\d+$/, 'x') // `4.20.11` -> `4.20.x`
}

// main application
module.exports = async ({owner, repo, infrastructurePath, env, releaseBranch, tag, ghToken, ghApprovalToken}) => { // eslint-disable-line max-len
  const token = ghToken
  const latestSha = await gitGetShaBranch({owner, repo, token})
  const combinedChanges = []
  tag = getTag({tag, env})

  // create bump pr branch
  const branchName = `${env}-${releaseBranch}`
  console.log(`trying to create branch "${branchName}"`)
  await gitCreateBranch({
    owner,
    repo,
    token,
    ref: `refs/heads/${branchName}`,
    sha: latestSha
  })

  const editorChange = await updateYamlFile({
    owner,
    repo,
    token,
    path: getFilePath({infrastructurePath, env, type: 'editor'}),
    tag
  })
  if (editorChange) combinedChanges.push(editorChange)

  const serverChange = await updateYamlFile({
    owner,
    repo,
    token,
    path: getFilePath({infrastructurePath, env, type: 'server'}),
    tag
  })
  if (serverChange) combinedChanges.push(serverChange)

  if (env === 'prod') {
    const editorStageChange = await updateYamlFile({
      owner,
      repo,
      token,
      path: getFilePath({infrastructurePath, env: 'stage', type: 'editor'}),
      tag: 'x.x.x'
    })
    if (editorStageChange) combinedChanges.push(editorStageChange)

    const serverStageChange = await updateYamlFile({
      owner,
      repo,
      token,
      path: getFilePath({infrastructurePath, env: 'stage', type: 'server'}),
      tag: 'x.x.x'
    })
    if (serverStageChange) combinedChanges.push(serverStageChange)
  }

  if (combinedChanges.length === 0) {
    throw new Error('Could not find files to update')
  }

  // Create a new tree with the changes
  const newTree = await createTree({
    owner,
    repo,
    token,
    baseTree: latestSha,
    tree: combinedChanges
  })

  const newCommit = await createCommit({
    owner,
    repo,
    token,
    message: `chore(release-management): Bump versions in ${env} for release management`,
    tree: newTree.sha,
    parents: [latestSha]
  })

  // Update the reference to point to the new commit
  await updateRef({
    owner,
    repo,
    token,
    ref: `heads/${branchName}`,
    sha: newCommit.sha
  })

  // create the bump pull request
  const pullRequest = await createPullRequest({
    owner,
    repo,
    token,
    title: `Bump editor and server to ${tag} in ${env} for release management`,
    head: branchName,
    base: 'main',
    body: `## Motivation

Bump editor and server versions to ${tag} in ${env} for release management
    `
  })

  if (ghApprovalToken) {
    // auto approve the pull request
    await createApprovalForPullRequest({
      owner,
      repo,
      token: ghApprovalToken,
      pullNumber: pullRequest.number,
      commitId: newCommit.sha
    })
  }
  return pullRequest
}
