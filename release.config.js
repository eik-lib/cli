import config from "@eik/semantic-release-config";

export default {
	extends: "@eik/semantic-release-config",
	plugins: [
		...(config.plugins || []),
		[
			"semantic-release-slack-bot",
			{
				notifyOnSuccess: false,
				notifyOnFail: false,
				packageName: "@eik/cli",
				branchesConfig: [
					{
						pattern: "main",
						notifyOnSuccess: true,
						onSuccessTemplate: {
							type: "mrkdwn",
							text: `A new version of \`$package_name\` has been released.
Current version is *$npm_package_version*
:package: *<$repo_url|$repo_path>:* <$repo_url/releases/tag/v$npm_package_version|v$npm_package_version>`,
						},
					},
				],
			},
		],
	],
};
