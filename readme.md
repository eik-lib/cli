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
