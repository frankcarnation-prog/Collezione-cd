# Tests

Automated checks for Album Ledger. Each test loads the real `index.html` in a simulated browser
(jsdom) with a throw-away library: nothing touches a real collection, and the network is mocked.

```
cd tests
npm install
npm test
```

They also run automatically on GitHub after every push (Actions → tests).

| File | What it checks |
|---|---|
| `smoke.test.js` | Start-up with 320 albums, no errors, version numbers agree (app and service worker), search, Tools badge, home screen |
| `backup.test.js` | Backup content; API keys left out unless ticked; storage line in Settings |
| `import.test.js` | CSV import: columns, duplicates, formats; backup files refused with a hint |
| `suggestions.test.js` | Matching with the library, ranking, reasons, the Suggestions screen |
| `wishlist-price.test.js` | Discogs price and link on the wishlist (Discogs mocked), 6-hour rule, eBay links |
| `sync-email.test.js` | Clear message when the sign-in e-mail cannot be sent |

Add a test with every new feature or bug fix.
