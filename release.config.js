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
							text: "$package_name $npm_package_version is now available - $repo_url",
						},
					},
					{
						pattern: "alpha",
						notifyOnSuccess: true,
						onSuccessTemplate: {
							text: "$package_name $npm_package_version (pre-release) is now available - $repo_url",
						},
					},
					{
						pattern: "beta",
						notifyOnSuccess: true,
						onSuccessTemplate: {
							text: "$package_name $npm_package_version (pre-release) is now available - $repo_url",
						},
					},
					{
						pattern: "next",
						notifyOnSuccess: true,
						onSuccessTemplate: {
							text: "$package_name $npm_package_version (pre-release) is now available - $repo_url",
						},
					},
				],
			},
		],
	],
};
