const semver = require('semver')
// const gitGetTags = require('./git/get-tags')
const gitGetContent = require('./git/get-content')
const gitGetShaBranch = require('./git/get-sha-branch')
const gitCreateBranch = require('./git/create-branch')
const updateContent = require('./git/update-content')
const createPullRequest = require('./git/create-pull-request')
const createApprovalForPullRequest = require('./git/create-approval-for-pull-request')

// main application
module.exports = async ({owner, repo, ghToken, ghApprovalToken, customer, infrastructurePath, env, releaseBranch, downstreamTag}) => { // eslint-disable-line max-len
  const token = ghToken
  const latestSha = await gitGetShaBranch({owner, repo, token})
  const downstreamTagWildcard = semver.coerce(downstreamTag).toString().replace(/\d+$/, 'x') // `4.20.11` -> `4.20.x`
  const combinedChanges = []
  let lastCommit

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

  // change the content in apps/${infrastructurePath}/${env}/flux/image-${customer}-editor.yaml
  // replace:
  // policy:
  //   semver:
  //     range: "x.x.x"
  // with:
  // policy:
  //   semver:
  //     range: "${downstreamTagWildcard}"

  const base64ObjEditor = await gitGetContent({
    owner,
    repo,
    token,
    path: `apps/${infrastructurePath}/${env}/flux/image-${customer}-editor.yaml`
  })

  if (base64ObjEditor) {
    const contentEditor = Buffer.from(base64ObjEditor.content, 'base64').toString()
    const updatedContentEditor = contentEditor.replace(/range: ".*"/, `range: "${downstreamTagWildcard}"`)
    const contentUpdateEditor = Buffer.from(updatedContentEditor).toString('base64')
    combinedChanges.push({
      path: base64ObjEditor.path,
      content: contentUpdateEditor,
      sha: base64ObjEditor.sha
    })
  }

  // // add commit
  // const editorCommit = await updateContent({
  //   owner,
  //   repo,
  //   token,
  //   path: base64ObjEditor.path,
  //   message: `chore(release-management): Bump editor version in ${env} for release management`,
  //   content: contentUpdateEditor,
  //   sha: base64ObjEditor.sha,
  //   branch: branchName
  // })

  // console.log(editorCommit)
  // change the content in apps/${infrastructurePath}/${env}/flux/image-${customer}-server.yaml

  const base64ObjServer = await gitGetContent({
    owner,
    repo,
    token,
    path: `apps/${infrastructurePath}/${env}/flux/image-${customer}-server.yaml`,
    branch: branchName
  })

  if (base64ObjServer) {
    const contentServer = Buffer.from(base64ObjServer.content, 'base64').toString()
    const updatedContentServer = contentServer.replace(/range: ".*"/, `range: "${downstreamTagWildcard}"`)
    const contentUpdateServer = Buffer.from(updatedContentServer).toString('base64')
    combinedChanges.push({
      path: base64ObjServer.path,
      content: contentUpdateServer,
      sha: base64ObjServer.sha
    })
  }

  if (env === 'prod') {
    const base64ObjEditorStage = await gitGetContent({
      owner,
      repo,
      token,
      path: `apps/${infrastructurePath}/stage/flux/image-${customer}-editor.yaml`,
      branch: branchName
    })

    if (base64ObjEditorStage) {
      const contentEditorStage = Buffer.from(base64ObjEditorStage.content, 'base64').toString()
      const updatedContentEditorStage = contentEditorStage.replace(/range: ".*"/, `range: "x.x.x"`)
      const contentUpdateEditorStage = Buffer.from(updatedContentEditorStage).toString('base64')
      combinedChanges.push({
        path: base64ObjEditorStage.path,
        content: contentUpdateEditorStage,
        sha: base64ObjEditorStage.sha
      })
    }

    const base64ObjServerStage = await gitGetContent({
      owner,
      repo,
      token,
      path: `apps/${infrastructurePath}/stage/flux/image-${customer}-server.yaml`,
      branch: branchName
    })

    if (base64ObjServerStage) {
      const contentServerStage = Buffer.from(base64ObjServerStage.content, 'base64').toString()
      const updatedContentServerStage = contentServerStage.replace(/range: ".*"/, `range: "x.x.x"`)
      const contentUpdateServerStage = Buffer.from(updatedContentServerStage).toString('base64')
      combinedChanges.push({
        path: base64ObjServerStage.path,
        content: contentUpdateServerStage,
        sha: base64ObjServerStage.sha
      })
    }
  }

  if (combinedChanges.length === 0) {
    throw new Error('No files to update')
  }

  for (const change of combinedChanges) {
    lastCommit = await updateContent({
      owner,
      repo,
      token,
      path: change.path,
      message: `chore(release-management): Bump versions in ${env} on ${change.path}`,
      content: change.content,
      sha: change.sha,
      branch: branchName
    })
  }

  // create the bump pull request
  const pullRequest = await createPullRequest({
    owner,
    repo,
    token,
    title: `Bump versions in ${env} for release management`,
    head: branchName,
    base: 'main',
    body: `## Motivation

Bump editor and server versions for release management
    `
  })

  // auto approval for pull request
  if (ghApprovalToken) {
    await createApprovalForPullRequest({
      owner,
      repo,
      token: ghApprovalToken,
      pullNumber: pullRequest.number,
      commitId: lastCommit.commit.sha
    })

    // auto approve the pull request
  }

  return pullRequest
}
