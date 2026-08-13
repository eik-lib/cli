import config from "@eik/eslint-config";

export default [
	...config,
	{
		rules: {
			"no-unused-vars": "off",
			// yargs is a production dependency; migrating to sade is tracked separately
			"e18e/ban-dependencies": ["error", { allowed: ["yargs"] }],
		},
	},
	{ ignores: ["test/fixtures/*"] },
];
