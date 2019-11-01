# Asset Pipe V3 CLI

## Installation

```sh
npm install -g @asset-pipe/cli
```

## Quickstart guide

### Step 1.

Generate an assets.json file in the current directory

```sh
asset-pipe init
```

Fill in the generated `assets.json` file with the necessary details.

For the `server` property, if you are using a locally running asset server
the server property will likely be `http://localhost:4001`

Set the `js.input` and `css.input` properties of `assets.json` with paths to client side
asset files in your project relative to the `assets.json` file.
Eg. if you have a `scripts.js` file in an assets directory, the `js.input` value will be `assets/scripts.js`

### Step 2

Run publish to publish your assets to the server

```sh
asset-pipe publish
```

For subsequent publishes, you will need to version your `asset.json` file before publishing again
since each publish version is immutable. You can do this by editing `assets.json` and setting a
new previously unpublished `version`. You should adhere to `semver` using a version number that makes sense. The cli can help you with this.

Eg. To bump the version from `1.0.0` to `1.0.1` you can use the version patch command like so:

```sh
asset-pipe version patch
```

## Additional tasks

### Publishing organisation wide global dependencies

When you wish to share a version of a module used across an organisation, you can use the `dependency` command to do so.

This feature does the following:

-   converts a module already published to npm to esm
-   makes it available through the asset server

#### Example use case

You might decide that all teams across your organisation should use the same version of lodash via a publish url (rather than each team bundling their own version).

To do so you would run:

```sh
asset-pipe dependency lodash 4.17.15
```

After running this, an esm friendly version of lodash will be available at the url:
`http://<asset server url>/<organisation>/pkg/lodash/4.17.15`

It's now possible for each team to reference this globally published module directly in their
own client side code as follows:

```js
import lodash from `http://<asset server url>/<organisation>/pkg/lodash/4.17.15`;
```

This has the benefit that if all teams are referencing lodash in this way, the browser will cache the module the first time it encouters it and all subsequent pages will not need to download it again.

### Aliasing published modules

Aliasing allows you to tag specific published versions of modules with a more general tag or version that you are also able to centrally change and control as needed.

The benefit of this is that you can alias a specific version of a dependency and then update that alias overtime as you publish new versions of the dependency and have all dependents immediately receive the change.

#### Example use case

Taking the previous example 1 step further, before we saw that we could globally publish a specific version of lodash, in this case `4.17.15`.

We can now set a major semver alias for this version:

```sh
asset-pipe alias lodash 4.15.15 4
```

We can now change our import statement to:

```js
import lodash from `http://<asset server url>/<organisation>/pkg/lodash/4`;
```

and everything will work as before.

When a new version of lodash comes out, we can create a global dependency for it as before:

```sh
asset-pipe dependency lodash 4.17.16
```

And then create a major semver alias for the new version like so:

```sh
asset-pipe alias js lodash 4.15.16 4
```

In this way, no client side code will need to be updated to reflect this change and it is considerably easier for multiple teams to stay in sync, using the same global shared dependency

### Using import maps to map "bare imports"

Import maps are [an emerging standard](https://github.com/WICG/import-maps) and a way to map "bare imports" such as `foo` in the import statement `import { bar, baz } from 'foo'` to modules to be loaded. In Asset Pipe, we provide a way to upload import map files and to specify them for use in bundling. Doing so allows you to specify, across an organisation, a common set of shared modules whether they be `react` or `lit-html` or whatever.

Making use of import maps is as follows.

1. Define an import map json file
2. Use the asset pipe CLI to upload the import map to the server
3. Specify the URL to your import map file(s) in your `assets.json` file
4. Use the `publish` commands, your import maps will be used to map bare imports in your code to the URLs you have defined in your import maps

#### Import maps, an example

Given the following import map file `import-map.json`

```json
{
    "imports": {
        "lit-html": "http://localhost:4001/finn/pkg/lit-html/v1/index.js",
        "lodash": "http://localhost:4001/finn/pkg/lodash/v4/index.js"
    }
}
```

The following command will upload the import map file `./import-map.json` in the current directory using the name `my-import-map` and the version `1.0.0`

```sh
asset-pipe --org finn map my-import-map 1.0.0 ./import-map.json
```

Given the following line now added to `assets.json`

```json
{
    "import-map": ["http://localhost:4001/finn/map/my-import-map/1.0.0"]
}
```

When we run `asset-pipe publish` any "bare imports" refering to either `lit-html` or `lodash` will be mapped to the URLs in our map.

In this way, you can control which version of `react` or `lit-html` or `lodash` all the apps in your organisation are using. In combination with package `alias` URLs you have a powerful way to manage key shared dependencies for your apps in production without the need to redeploy or rebundle when a new version of a dependency is released.

## API Documentation

### Command Summary

| command    | description                                                     |
| ---------- | --------------------------------------------------------------- |
| init       | Create an assets.json file in the current directory             |
| version    | Helper command for bumping your apps `asset.json` version field |
| publish    | Publish an app bundle                                           |
| dependency | Publish a dependency bundle                                     |
| map        | Sets or deletes a "bare" import entry in an import-map file     |
| alias      | Sets a major semver alias for a given dependency or map         |

### Commands Overview

#### init

This command takes no input and creates a new `assets.json` file in the current directory with the following content:

```json
{
    "organisation": "[required]",
    "name": "[required]",
    "version": "1.0.0",
    "server": "http://assets-server.svc.prod.finn.no",
    "js": {
        "input": "[path to js entrypoint]",
        "options": {}
    },
    "css": {
        "input": "[path to css entrypoint]",
        "options": {}
    },
    "import-map": []
}
```

You will then need to change the various fields as appropriate. If you are running a local asset server, the default server url should be `http://localhost:4001`.

##### assets.json properties

| property     | description                                                         |
| ------------ | ------------------------------------------------------------------- |
| organisation | Unique organisation namespace of your choosing                      |
| name         | App name, must be unique to each organisation                       |
| version      | App version, unique to each app. Must be increased for each publish |
| server       | Address to the asset server                                         |
| js           | Configuration for JavaScript assets                                 |
| css          | Configuration for CSS assets                                        |
| import-map   | Specify import maps to be used to map bare imports during bundling  |

###### organisation

All asset uploads are scoped to an `organisation`. You may choose any organisation name that is not already taken or that you already belong to. Organisation names may contain any letters or numbers as well as the `-` and `_` characters.

_Example_

```json
{
    "organisation": "finn"
}
```

###### name

All asset uploads within each organisation must have a name. When publishing a dependency from npm the name will be the package name taken from the module's `package.json` file. When publishing the assets for your app, the `name` field of your project's `assets.json` file is used.
Names may contain any letters or numbers as well as the `-` and `_` characters.

```json
{
    "name": "my-awesome-app"
}
```

###### version

All asset uploads are unique by organisation, name and version. It is not possible to republish the same app with the same version in the same organisation. In order to publish a new version of an asset, the version number must first be incremented. When publishing an asset from npm, the version of the package comes from the packages `package.json` version field. When publishing assets for your own app, the version comes from the version specified in `assets.json`. In both cases, versions comply with semver.

The `version` property in `assets.json` starts at `1.0.0` by convention and should be incremented as you see fit either manually or by using the `asset-pipe version major|minor|patch` command.

Either way, when you attempt to republish a package with the same version, publishing will fail and you will need to update the version field before trying again.

```json
{
    "version": "1.0.0"
}
```

###### server

This is the address to the asset server you are using. This might be a locally running version of the asset server (usually `http://localhost:4001`) or an asset server running in production (TBD)

```json
{
    "server": "http://localhost:4001"
}
```

###### js

This field is used to configure bundling and publishing of JavaScript assets. Use `js.input` to configure the location on disk, relative to `assets.json`, where the entrypoint for your JavaScript client side assets are located.

_scripts.js file inside assets folder_

```json
{
    "js": {
        "input": "./assets/scripts.js"
    }
}
```

###### css

This field is used to configure bundling and publishing of CSS assets. Use `css.input` to configure the location on disk, relative to `assets.json`, where the entrypoint for your CSS client side assets are located.

_styles.css file inside assets folder_

```json
{
    "css": {
        "input": "./assets/styles.css"
    }
}
```

###### import-map

This field is used to configure the location of any import map files to be used when creating bundles. The field should be an array and can hold any number of url strings pointing to locations of import-map files that will be downloaded and merged together

_defining a single import map file_

```json
{
    "import-map": ["http://localhost:4001/map/my-import-map/1.0.0"]
}
```

#### version

This command updates the `version` field of an `assets.json` file in the current directory based on the argument given (`major`, `minor`, `patch`).

The command takes the form:

```sh
asset-pipe version major|minor|patch
```

**Examples**

_Increase the version's semver major by 1_

```bash
asset-pipe version major
```

_Increase the version's semver minor by 1_

```bash
asset-pipe version minor
```

_Increase the version's semver patch by 1_

```bash
asset-pipe version patch
```

#### publish

This command publishes the app's client side assets to the asset server based on the values in an `assets.json` file in the current directory.

The command takes the form:

```sh
asset-pipe publish [optional arguments]
```

**Example**

_Publishing app assets to server_

```bash
asset-pipe publish
```

#### dependency

This command will download the specified (by name and version) package from NPM, create a bundle with it and then publish it to the asset server. The resulting bundle will be in esm module format, converting from common js if needed.

_Note_ The arguments `server`, `organisation` and `import-map` are taken from `assets.json` if such a file is present in the current directory. If not, you will need to specify these values with the command line flags `--server`, `--org` and `--map`.

The command takes the form:

```sh
asset-pipe dependency [optional arguments] <name> <version>
```

**Example**

_Publishing a dependency from npm_

```bash
asset-pipe dependency lit-html 1.1.2
# asset-pipe dependency --server http://localhost:4001 --org finn --map http://localhost:4001/finn/map/my-import-map/1.0.0 lit-html 1.1.2
```

#### alias

This command creates a semver alias for a given published bundle. Creating aliases allows for more flexible referencing of published bundles. You can update an alias to point to the latest version of a bundle without needing to update every client that makes use of your bundle.

_Note_ The arguments `server` and `organisation` are taken from `assets.json` if such a file is present in the current directory. If not, you will need to specify these values with the command line flags `--server` and `--org`.

The command takes the form:

```sh
asset-pipe alias [optional arguments] <name> <version> <alias>
```

_Example_

Running the following command...

```bash
asset-pipe alias lit-html 1.1.2 1
# asset-pipe alias --server http://localhost:4001 --org finn lit-html 1.1.2 1
```

...will create or update the `lit-html` alias `1` to point at `lit-html` version `1.1.2`

#### import-map

This command uploads an import map json file you have created locally to the server. You must upload the file with a `name` and a `version` and the file must be of the form:

```json
{
    "imports": {
        "<dependency name 1>": "url to dependency",
        "<dependency name 2>": "url to dependency"
    }
}
```

_Note_ The arguments `server` and `organisation` are taken from `assets.json` if such a file is present in the current directory. If not, you will need to specify these values with the command line flags `--server` and `--org`.

The command takes the form:

```sh
asset-pipe map [optional arguments] <name> <version> <path to file>
```

```bash
asset-pipe map my-import-map 1.0.0 ./import-map.json
# asset-pipe map --server http://localhost:4001 --org finn my-import-map 1.0.0 ./import-map.json
```

## Programmatic Usage

All of the commands described above can be used programmatically by importing this package. Each command and its programmatic usage is given below.

### init

```js
const cli = require('@asset-pipe/cli');
const Init = cli.init;

const result = await new Init(options).run();
```

#### options

| name    | description                           | type   | default         | required |
| ------- | ------------------------------------- | ------ | --------------- | -------- |
| logger  | log4j compliant logger object         | object | `null`          | no       |
| cwd     | path to current working directory     | string | `process.cwd()` | no       |
| org     | organisation name                     | string | `''`            | no       |
| name    | app name                              | string | `''`            | no       |
| version | app version                           | string | `'1.0.0'`       | no       |
| server  | URL to asset server                   | string | `''`            | no       |
| js      | path to client side script entrypoint | string | `''`            | no       |
| css     | path to client side style entrypoint  | string | `''`            | no       |

### version

```js
const cli = require('@asset-pipe/cli');
const Version = cli.version;

const result = await new Version(options).run();
```

#### options

| name   | description                           | type   | default         | options                   | required |
| ------ | ------------------------------------- | ------ | --------------- | ------------------------- | -------- |
| logger | log4j compliant logger object         | object | `null`          |                           | no       |
| cwd    | path to current working directory     | string | `process.cwd()` |                           | no       |
| level  | semver level to bump version field by | string | null            | `major`, `minor`, `patch` | yes      |

### publish

```js
const cli = require('@asset-pipe/cli');
const Publish = cli.publish.app;

const result = await new Publish(options).run();
```

#### options

| name    | description                           | type     | default         | required |
| ------- | ------------------------------------- | -------- | --------------- | -------- |
| logger  | log4j compliant logger object         | object   | `null`          | no       |
| cwd     | path to current working directory     | string   | `process.cwd()` | no       |
| org     | organisation name                     | string   |                 | yes      |
| name    | app name                              | string   |                 | yes      |
| version | app version                           | string   |                 | yes      |
| server  | URL to asset server                   | string   |                 | yes      |
| js      | path to client side script entrypoint | string   |                 | yes      |
| css     | path to client side style entrypoint  | string   |                 | yes      |
| map     | array of urls of import map files     | string[] | `[]`            | no       |
| dryRun  | exit early and print results          | boolean  | false           | no       |

### dependency

```js
const cli = require('@asset-pipe/cli');
const Dependency = cli.publish.dependency;

const result = await new Dependency(options).run();
```

### map

```js
const cli = require('@asset-pipe/cli');
const Map = cli.publish.map;

const result = await new Map(options).run();
```

#### options

| name    | description                            | type   | default         | required |
| ------- | -------------------------------------- | ------ | --------------- | -------- |
| logger  | log4j compliant logger object          | object | `null`          | no       |
| cwd     | path to current working directory      | string | `process.cwd()` | no       |
| org     | organisation name                      | string |                 | yes      |
| name    | app name                               | string |                 | yes      |
| version | app version                            | string |                 | yes      |
| server  | URL to asset server                    | string |                 | yes      |
| file    | path to import map file to be uploaded | string |                 | yes      |

### alias

```js
const cli = require('@asset-pipe/cli');
const Alias = cli.alias;

const result = await new Alias(options).run();
```

#### options

| name    | description                             | type   | default | choices      | required |
| ------- | --------------------------------------- | ------ | ------- | ------------ | -------- |
| logger  | log4j compliant logger object           | object | `null`  |              | no       |
| server  | URL to asset server                     | string |         |              | yes      |
| org     | organisation name                       | string |         |              | yes      |
| type    | type of resource to alias               | string |         | `pkg`, `map` | yes      |
| name    | app name                                | string |         |              | yes      |
| version | app version                             | string |         |              | yes      |
| alias   | major number of a semver version number | string |         |              | yes      |
