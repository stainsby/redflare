# About Redflare

This is the source code for the
[Redflare website](http://redflare.ofthings.net), a console-like
web application for monitoring online Red Eclipse games that
are registered with the master [Red Eclipse](http://www.redeclipse.net/)
server.

# Installing

The website runs as a `node.js` application. Ensure `node.js` is installed,
clone the git repository, and in the top-level:

    npm install

to install the dependencies.

# Running

Run with:

    node ./app.js

In production, we use nodejitsu's `forever` tool to run the site.

By default, the web UI will listen on port 28080. Edit `config.js` to
change this and other settings.

# Copyright

Copyright &copy; 2012 Sustainable Software Pty Ltd. All files in the Redflare 
project are licensed under the GNU Affero General Public License version 3.
