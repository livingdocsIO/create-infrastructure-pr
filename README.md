# Create Infrastructure PR

This script creates a PR in the specified infrastructure repository, updating livingdocs-server and livingdocs-editor image in the specified environment.

To run it you need to get a GH token with access to the infrastructure repo (downstream release tokens are valid), then execute:

```bash
npx github:livingdocsIO/create-infrastructure-pr \
  --owner livingdocsIO \
  --repo infrastructure-onboarding \
  --release-branch release-2024-11-16 \
  --env stage \
  --tag v4.20.11 \
  --gh-token ${your-github-token}
```

There are two repositories(`infrastructure-20min` and `infrastructure-handelsblatt`) that require extra parameter (`infrastructure-path`):

```bash
# For HMG
npx github:livingdocsIO/create-infrastructure-pr \
  --owner livingdocsIO \
  --repo infrastructure-handelsblatt \
  --infrastructure-path handelsblatt \
  --release-branch ${release-branch-name} \
  --env ${environment} \
  --tag v${tag-to-release} \
  --gh-token ${your-github-token}
# For 20min
npx github:livingdocsIO/create-infrastructure-pr \
  --owner livingdocsIO \
  --repo infrastructure-20min \
  --infrastructure-path 20min \
  --release-branch ${release-branch-name} \
  --env ${environment} \
  --tag v${tag-to-release} \
  --gh-token ${your-github-token}
```

There is some magic under the hood.

- If you define `--env prod` the script will set the stage image from any value to `x.x.x` , if the value was already `x.x.x` there won’t be a diff in the commit there.
- If you define `--env stage --tag v3.4.5` , any number valid tag would work, the script will automatically strip the last number (patch/fix) and replace it with an `x` (latest). In the example here `v3.4.5` would be updated in stage to `v3.4.x` . This functionality only works for `stage`
- The script works with both `v1.2.3` or `1.2.3`

## Unsupported

If you want to go back to latest (`x.x.x`), for example running:

```bash
npx github:livingdocsIO/create-infrastructure-pr \
  --owner livingdocsIO \
  --repo infrastructure-onboarding \
  --release-branch release-2024-11-16 \
  --env stage \
  --tag x.x.x \
  --gh-token ${your-github-token}
```

This script won’t work. There is no logic to handle that case and since `x.x.x` is not a valid semantic version, the script would fail.
