# Rig entrypoint documentation

This entrypoint is reserved for rigs with the `Dá-lhe!` SimHub dashboard that are trying to communicate with the `Dá-lhe!` app. Its unauthenticated, so technically anyone can connect to this entrypoiny. It expects a slug with the rig's UUID, which is pre-created in the database, and then inserted into the plugin's files. The plugin then sends GET requests with that UUID, which hints to the server about who is trying to send or request information.

Because of limitations with dashboard development, Simhub can only send GET requests. This means publications of laptimes are made with said GET requests. The entrypoints are fairly protected against duplicate requests, and try to fail gracefully instead of error-ing, so that the SimHub overlay doesn't cache an error to that call, effectively blocking future requests.

The main entrypoint is going to be timely polled when SimHub is running the dashboard, and simply asks what's the rig name in the app, and who's driving. An empty driver name will infer that no one is driving the cockpit currently.

The overlay will feature a QR code when its not in a race, so that drivers can connect to it through the mobile app. The scan will take users to an authorized page, which means it will prompt the user to login first in order to connect to a rig. If the user is already connected, the QR code will take them to the connect page which is an entrance hall to the lounge room. It lets you either connect to the rig or spectate it - connecting in will log out other drivers that were connected previously.

The rig (or rather, the simhub dashboard) will also send some other requests under certain conditions, all under the `/send/*` route.

- `/live`: will send information about the current lap. Current lap time, split, delta to the best time, and sector times.
- `/session`: will send information about the current session. Track name, car name, car category, weather info, etc. This won't be updated as fast as `/live`.
- `/new`: This request is the only one that needs an event set up in order to function. When a new _valid_ lap is made, the dashboard will send a request with the complete information of this last lap that was made - laptime, sector times, the works.
