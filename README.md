# GitLint Action

This GitHub Action ensures that your naming conventions for commits, branches, and pull requests
are being respected. GitLint uses min. and max. character counts as well as regular expressions
to check against the data. It is recommended to add a workflow that runs when a pull request is
created or when it gets updated.

## Usage

Create the file `.github/workflows/gitlint.yaml` in your repository and add the following workflow:

```yaml
name: GitLint

on:
  pull_request:

jobs:
  gitlint:
    runs-on: ubuntu-latest
    name: GitLint
    steps:
      - name: Lint commits, branches, and pull requests
        uses: aschbacd/gitlint-action@v1.0.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          commit-message-body-max-length: 72
          commit-message-subject-max-length: 50
          prohibit-unknown-commit-authors: true
          prohibit-unknown-commit-committers: true
          re-commit-message-subject: "^[A-Z].*((?!\\.).)$"
          re-pull-request-title: "^[A-Z].*((?!\\.).)$"
```

## Customization

The following input keys can be used in your GitHub Actions workflow (shown above).

| Key                                | Description                                                  | Default                 | Recommended                   |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------- | ----------------------------- |
| commit-message-body-max-length     | Max. characters for line in commit message body              | -1 (disabled)           | 72                            |
| commit-message-body-min-length     | Min. characters for line in commit message body              | -1 (disabled)           | -1 (disabled)                 |
| commit-message-subject-max-length  | Max. characters for commit message subject                   | -1 (disabled)           | 50                            |
| commit-message-subject-min-length  | Min. characters for commit message subject                   | -1 (disabled)           | -1 (disabled)                 |
| github-token                       | Token used to authenticate against GitHub api                | `-`                     | `${{ secrets.GITHUB_TOKEN }}` |
| prohibit-unknown-commit-authors    | Commit author must be GitHub user                            | `false`                 | `true`                        |
| prohibit-unknown-commit-committers | Commit committer must be GitHub user                         | `false`                 | `true`                        |
| prohibit-unsigned-commits          | Commits without a valid signature are invalid                | `false`                 | `false`                       |
| re-branch-name                     | Regex used to check branch name                              | `.*`                    | `[a-z]+\/.+`                  |
| re-commit-author-email             | Regex used to check commit author email                      | `.*`                    | `.*`                          |
| re-commit-author-name              | Regex used to check commit author name                       | `.*`                    | `.*`                          |
| re-commit-committer-email          | Regex used to check commit committer email                   | `.*`                    | `.*`                          |
| re-commit-committer-name           | Regex used to check commit committer name                    | `.*`                    | `.*`                          |
| re-commit-message-body             | Regex used to check commit message body (DotAll)             | `.*`                    | `.*`                          |
| re-commit-message-split            | Regex used to split commit message subject and body (DotAll) | `([^\n]*)(?:\n\n(.*))?` | `([^\n]*)(?:\n\n(.*))?`       |
| re-commit-message-subject          | Regex used to check commit message subject                   | `.*`                    | `^[A-Z].*((?!\.).)$`          |
| re-pull-request-title              | Regex used to check pull request title                       | `.*`                    | `^[A-Z].*((?!\.).)$`          |

## Resources

If you want to learn more about Git commits check out [this section](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History)
of the Pro Git book.
