const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
  try {

    // -----
    // --------------- GET DATA
    // ----------

    // Get octokit
    const githubToken = core.getInput('github-token')
    const octokit = github.getOctokit(githubToken)

    // Get context
    const eventName = github.context.eventName
    const payload = github.context.payload
    const owner = payload.repository.owner.login
    const repo = payload.repository.name

    const ref = payload.ref
    const pullRequest = payload.pull_request

    // -----
    // --------------- GET INPUT
    // ----------

    const commitMessageBodyMaxLength = parseInt(core.getInput('commit-message-body-max-length'))
    const commitMessageBodyMinLength = parseInt(core.getInput('commit-message-body-min-length'))
    const commitMessageSubjectMaxLength = parseInt(core.getInput('commit-message-subject-max-length'))
    const commitMessageSubjectMinLength = parseInt(core.getInput('commit-message-subject-min-length'))

    const prohibitBlankLinesCmBody = (core.getInput('prohibit-blank-lines-cm-body') == 'true')
    const prohibitUnknownCommitAuthors = (core.getInput('prohibit-unknown-commit-authors') == 'true')
    const prohibitUnknownCommitCommitters = (core.getInput('prohibit-unknown-commit-committers') == 'true')
    const prohibitUnsignedCommits = (core.getInput('prohibit-unsigned-commits') == 'true')

    const regexBranchName = RegExp(core.getInput('re-branch-name'))
    const regexCommitAuthorEmail = RegExp(core.getInput('re-commit-author-email'))
    const regexCommitAuthorName = RegExp(core.getInput('re-commit-author-name'))
    const regexCommitCommitterEmail = RegExp(core.getInput('re-commit-committer-email'))
    const regexCommitCommitterName = RegExp(core.getInput('re-commit-committer-name'))
    const regexCommitMessageBody = RegExp(core.getInput('re-commit-message-body'), 's')
    const regexCommitMessageSplit = RegExp(core.getInput('re-commit-message-split'), 's')
    const regexCommitMessageSubject = RegExp(core.getInput('re-commit-message-subject'))
    const regexPullRequestTitle = RegExp(core.getInput('re-pull-request-title'))
    const regexTagName = RegExp(core.getInput('re-tag-name'))

    // -----
    // --------------- CHECK PULL REQUEST
    // ----------

    if (eventName === "pull_request") {
      // Print pull request title
      core.info(`Pull request title: ${pullRequest.title}`)

      // Check pull request title
      if (!regexPullRequestTitle.test(pullRequest.title))
        core.setFailed("Pull Request title does not match regex")
    }

    // -----
    // --------------- CHECK BRANCH
    // ----------

    // Get branch name
    let branchName = ""
    if (eventName === "pull_request") {
      branchName = pullRequest.head.ref
    } else if (eventName === "push" && ref.startsWith("refs/heads")) {
      branchName = ref.replace("refs/heads/", "")
    }

    if (branchName !== "") {
      // Print branch name
      core.info(`Branch name: ${branchName}`)

      // Check branch name
      if (!regexBranchName.test(branchName))
        core.setFailed("Branch name does not match regex")
    }

    // -----
    // --------------- CHECK TAG
    // ----------

    if (eventName === "push" && ref.startsWith("refs/tags")) {
      // Get tag name
      const tagName = ref.replace("refs/tags/", "")

      // Print tag name
      core.info(`Tag name: ${tagName}`)

      // Check tag name
      if (!regexTagName.test(tagName))
        core.setFailed("Tag name does not match regex")
    }

    // -----
    // --------------- CHECK COMMITS
    // ----------

    // Get commits
    let commits = []
    if (eventName === "pull_request") {
      // Get all commits from pull request
      const { data } = await octokit.rest.pulls.listCommits({
        owner: owner,
        repo: repo,
        pull_number: pullRequest.number
      })

      // Set commits
      commits = data
    } else if (eventName === "push") {
      // Get pushed commits
      let commitPromises = []

      payload.commits.forEach(commit => {

        commitPromises.push(octokit.rest.repos.getCommit({
          owner: owner,
          repo: repo,
          ref: commit.id
        }))
      })

      // Append commits
      for await (const { data: commit } of commitPromises) {
        commits.push(commit)
      }
    }

    // Check all commits
    commits.forEach(commit => {
      if (commit.parents && commit.parents.length > 1) {
        core.info(`Merge commit detected: ${commit.sha}`);
        return;
      }
      // Split commit message
      let matches = regexCommitMessageSplit.exec(commit.commit.message)
      let commitMessageSubject = matches[1]
      let commitMessageBody = matches[2]

      console.log('-----')
      core.info(`Commit hash: ${commit.sha}`)
      core.info(`Commit author email: ${commit.commit.author.email}`)
      core.info(`Commit author name: ${commit.commit.author.name}`)
      core.info(`Commit author GitHub account: ${commit.author == null ? undefined : commit.author.login}`)
      core.info(`Commit committer email: ${commit.commit.committer.email}`)
      core.info(`Commit committer name: ${commit.commit.committer.name}`)
      core.info(`Commit committer GitHub account: ${commit.committer == null ? undefined : commit.committer.login}`)
      core.info(`Commit has valid signature: ${commit.commit.verification.verified}`)
      core.info(`Commit message subject: ${commitMessageSubject}`)
      core.info(`Commit message body: ${commitMessageBody}`)

      // Check commit author
      if (prohibitUnknownCommitAuthors && commit.author == null)
        core.setFailed(`Commit author does not exist on GitHub (${commit.sha.substr(0, 7)})`)

      if (!regexCommitAuthorEmail.test(commit.commit.author.email))
        core.setFailed(`Commit author email does not match regex (${commit.sha.substr(0, 7)})`)

      if (!regexCommitAuthorName.test(commit.commit.author.name))
        core.setFailed(`Commit author name does not match regex (${commit.sha.substr(0, 7)})`)

      // Check commit committer
      if (prohibitUnknownCommitCommitters && commit.committer == null)
        core.setFailed(`Commit committer does not exist on GitHub (${commit.sha.substr(0, 7)})`)

      if (!regexCommitCommitterEmail.test(commit.commit.committer.email))
        core.setFailed(`Commit committer email does not match regex (${commit.sha.substr(0, 7)})`)

      if (!regexCommitCommitterName.test(commit.commit.committer.name))
        core.setFailed(`Commit committer name does not match regex (${commit.sha.substr(0, 7)})`)

      // Check for valid signature
      if (prohibitUnsignedCommits && !commit.commit.verification.verified)
        core.setFailed(`Commit has no valid signature (${commit.sha.substr(0, 7)})`)

      // Check commit message subject
      if (commitMessageSubjectMinLength != -1 && commitMessageSubject.length < commitMessageSubjectMinLength)
        core.setFailed(`Commit message subject is too short (${commit.sha.substr(0, 7)})`)

      if (commitMessageSubjectMaxLength != -1 && commitMessageSubject.length > commitMessageSubjectMaxLength)
        core.setFailed(`Commit message subject is too long (${commit.sha.substr(0, 7)})`)

      if (!regexCommitMessageSubject.test(commitMessageSubject))
        core.setFailed(`Commit message subject does not match regex (${commit.sha.substr(0, 7)})`)

      // Check commit message body
      if (commitMessageBody != null) {
        commitMessageBody.split("\n").forEach(function (line, index) {
          if (line.length == 0) {
            if (prohibitBlankLinesCmBody)
              core.setFailed(`Blank lines are not allowed in commit message body; line ${(index+1).toString()} (${commit.sha.substr(0, 7)})`)
          } else if (commitMessageBodyMinLength != -1 && line.length < commitMessageBodyMinLength) {
            core.setFailed(`Commit message body line ${(index+1).toString()} is too short (${commit.sha.substr(0, 7)})`)
          }

          if (commitMessageBodyMaxLength != -1 && line.length > commitMessageBodyMaxLength)
            core.setFailed(`Commit message body line ${(index+1).toString()} is too long (${commit.sha.substr(0, 7)})`)
        })

        if (!regexCommitMessageBody.test(commitMessageBody))
          core.setFailed(`Commit message body does not match regex (${commit.sha.substr(0, 7)})`)
      }
    })
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()
