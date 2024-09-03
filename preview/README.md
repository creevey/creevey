This is a fallback for package.json's `exports.addon` field. It's required for outdated environments (like node 11 and typescript with the "node" moduleResolution) to resolve imports from `creevey/addon` properly.

See https://github.com/andrewbranch/example-subpath-exports-ts-compat. The fallback uses the "package-json-redirects" startegy.
