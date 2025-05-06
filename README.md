# character collection tracker (updated week 15 homework)

a simple web application to track and manage your collection.

## features

### new filtering capabilities
- filter by card condition (mint, near mint, excellent, good, poor)
- date range filtering (from/to) based on purchase date
- advanced filters section (collapsible)
- card number range filtering (min/max)
- sorting options:
  - name (a-z or z-a)
  - card number (low-high or high-low)
  - date added (newest or oldest)

### basic functionality
- add cards to your collection with details (name, number, rarity, condition)
- search for pokemon using the pokeapi
- view your collection in a grid layout
- filter by name and rarity
- edit and delete cards
- view detailed card information
- responsive design for mobile and desktop

## technical details

### data storage
- uses browser's localstorage to save your collection
- no server required, everything is client-side

### external apis
- integrates with pokeapi to fetch pokemon data and images
- automatically loads official pokemon artwork

### file structure
- index.html - main html structure and content
- styles.css - all styling for the application
- app.js - javascript functionality

## how to use

### adding cards
1. search for a pokemon or select from dropdown
2. fill in card details (number, rarity, condition)
3. click "add card" button

### filtering cards
1. use the search box to filter by name
2. use the dropdown to filter by rarity
3. use the condition dropdown to filter by card condition
4. use date range inputs to filter by purchase date
5. click "advanced filters" for more options:
   - sort your collection in different ways
   - filter by card number range

## browser compatibility
- works in all modern browsers (chrome, firefox, safari, edge)
- requires javascript to be enabled

## future improvements
- export/import collection as json
- card value tracking
- set completion tracking
- image upload option for custom cards
- dark/light theme toggle

## license
free to use and modify
