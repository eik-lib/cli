# Asset Pipe V3 CLI

## Installation

```sh
npm install -g @asset-pipe/cli
```

## Usage guide

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

When you wish to share a version of a module used across an organisation, you can use the publish command to do so.

This feature does the following:

-   converts a module already published to npm to esm
-   makes it available through the asset server

#### Example use case

You might decide that all teams across your organisation should use the same version of lodash via a publish url (rather than each team bundling their own version).

To do so you would run:

```sh
asset-pipe publish js lodash 4.17.15
```

After running this, an esm friendly version of lodash will be available at the url:
`http://<asset server url>/<organisation>/js/lodash/4.17.15`

It's now possible for each team to reference this globally published module directly in their
own client side code as follows:

```js
import lodash from `http://<asset server url>/<organisation>/js/lodash/4.17.15`;
```

This has the benefit that if all teams are referencing lodash in this way, the browser will cache the module the first time it encouters it and all subsequent pages will not need to download it again.

### Aliasing published modules

Aliasing allows you to tag specific published versions of modules with a more general tag or version that you are also able to centrally change and control as needed.

The benefit of this is that you can alias a specific version of a dependency and then update that alias overtime as you publish new versions of the dependency and have all dependents immediately receive the change.

#### Example use case

Taking the previous example 1 step further, before we saw that we could globally publish a specific version of lodash, in this case `4.17.15`.

We can now set a major semver alias for this version:

```sh
asset-pipe alias js lodash 4.15.15
```

We can now change our import statement to:

```js
import lodash from `http://<asset server url>/<organisation>/js/lodash/4`;
```

and everything will work as before.

When a new version of lodash comes out, we can publish it as before:

```sh
asset-pipe publish js lodash 4.17.16
```

And then create a major semver alias for the new version like so:

```sh
asset-pipe alias js lodash 4.15.16
```

In this way, no client side code will need to be updated to reflect this change and it is considerably easier for multiple teams to stay in sync, using the same global shared dependency

### Using import maps to map "bare imports"

TBD

## API Documentation

### Command Summary

| command    | description                                                    |
| ---------- | -------------------------------------------------------------- |
| init       | Create an assets.json file in the current directory            |
| version    | Helper command for bumping your apps asset version             |
| publish    | Publish a dependency bundle or an app bundle                   |
| alias      | Sets a major semver alias for a given dependency or app bundle |
| import-map | Sets or deletes a "bare" import entry in an import-map file    |

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
    }
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

#### version

This command updates the `version` field of an `assets.json` in the current directory based on the argument given (`major`, `minor`, `patch`).

**Examples**

_Increase the version's major by 1_

```bash
asset-pipe major
```

_Increase the version's minor by 1_

```bash
asset-pipe minor
```

_Increase the version's patch by 1_

```bash
asset-pipe patch
```

#### publish

This command publishes to the asset server. Based on the arguments given, it will perform 1 of 2 actions.

If no arguments are given the command will the app's client side assets to the asset server based on the values in an `assets.json` file in the current directory.

If the name and version of an npm package are given, the command will download the specified package from npm, create a bundle with it and then publish it to the asset server. The resulting bundle will be in esm module format, converting from common js if needed.

**Examples**

_Publishing app assets to server_

```bash
asset-pipe publish
```

_Publishing a dependency from npm_

```bash
asset-pipe publish js lit-html 1.1.2
```

#### alias

This command creates a semver alias for a given published bundle. Creating aliases allows for more flexible referencing of published bundles. You can update an alias to point to the latest version of a bundle without needing to update every client that makes use of your bundle.

_Example_

Running the following command...

```bash
asset-pipe alias js lit-html 1.1.2
```

...will create or update the `lit-html` alias `1` to point at `lit-html` version `1.1.2`

#### import-map

TBD
