// DOM Elements
const collectionList = document.getElementById('collection-list');
const collectionSearch = document.getElementById('collection-search');
const typeFilter = document.getElementById('filter-type');
const sortByFilter = document.getElementById('sort-by');
const clearFiltersBtn = document.getElementById('clear-filters');
const toggleAdvancedFiltersBtn = document.getElementById('toggle-advanced-filters');
const advancedFiltersContent = document.querySelector('.advanced-filters-content');
const emptyCollection = document.getElementById('empty-collection');
const pokemonModal = document.getElementById('pokemon-modal');
const modalDetails = document.getElementById('modal-details');
const closeModalBtn = document.querySelector('.close');

// LocalStorage key
const STORAGE_KEY = 'pokemon_tracker_collection';

// State variables
let collection = [];

// Load collection from localStorage
function loadCollection() {
    try {
        const storedCollection = localStorage.getItem(STORAGE_KEY);
        if (storedCollection) {
            collection = JSON.parse(storedCollection);
        }
        renderCollection();
    } catch (error) {
        console.error('Error loading collection from localStorage:', error);
        const errorMsg = document.createElement('p');
        errorMsg.className = 'no-results';
        errorMsg.textContent = 'Failed to load your collection. Please try again later.';
        collectionList.appendChild(errorMsg);
    }
}

// Save collection to localStorage
function saveCollection() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (error) {
        console.error('Error saving collection to localStorage:', error);
        alert('Failed to save your collection changes.');
    }
}

// Delete Pokémon from collection
function deletePokemon(uuid) {
    if (!confirm('Are you sure you want to remove this Pokémon from your collection?')) {
        return;
    }
    
    // Remove from collection
    collection = collection.filter(p => p._uuid !== uuid);
    
    // Save to localStorage
    saveCollection();
    
    // Update the collection display
    renderCollection();
    
    // Close modal if open
    closeModal();
}

// Sort collection based on sort option
function sortCollection(pokemonList, sortOption) {
    const sortedList = [...pokemonList];
    
    switch(sortOption) {
        case 'name-asc':
            sortedList.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sortedList.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'id-asc':
            sortedList.sort((a, b) => a.id - b.id);
            break;
        case 'id-desc':
            sortedList.sort((a, b) => b.id - a.id);
            break;
        case 'date-added-desc':
            sortedList.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
        case 'date-added-asc':
            sortedList.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
            break;
        default:
            // Default sort by ID
            sortedList.sort((a, b) => a.id - b.id);
    }
    
    return sortedList;
}

// Render the collection with filters
function renderCollection() {
    // Check if collection is empty
    if (collection.length === 0) {
        collectionList.innerHTML = '';
        emptyCollection.style.display = 'block';
        return;
    }
    
    // Hide empty message
    emptyCollection.style.display = 'none';
    
    // Get filter values
    const searchTerm = collectionSearch.value.toLowerCase();
    const typeValue = typeFilter.value;
    const sortValue = sortByFilter.value;
    
    // Filter the collection
    let filteredCollection = collection.filter(pokemon => {
        // Name filter
        const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm);
        
        // Type filter
        const matchesType = !typeValue || pokemon.types.includes(typeValue);
        
        return matchesSearch && matchesType;
    });
    
    // Sort the filtered collection
    filteredCollection = sortCollection(filteredCollection, sortValue);
    
    // Clear the collection list
    collectionList.innerHTML = '';
    
    // Display no results message if filtered collection is empty
    if (filteredCollection.length === 0) {
        const noResults = document.createElement('p');
        noResults.className = 'no-results';
        noResults.textContent = 'No Pokémon match your filters.';
        collectionList.appendChild(noResults);
        return;
    }
    
    // Create card elements for each Pokémon
    filteredCollection.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.uuid = pokemon._uuid;
        
        // Create image element
        const cardImage = document.createElement('img');
        cardImage.className = 'card-image';
        cardImage.src = pokemon.image;
        cardImage.alt = pokemon.name;
        cardImage.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJBMzM0MCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNTAiIGZpbGw9IiM0YTU1NjgiLz48L3N2Zz4=';
        };
        
        // Create info div
        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';
        
        // Create name and ID
        const nameElement = document.createElement('h3');
        nameElement.textContent = pokemon.name;
        
        const idElement = document.createElement('p');
        idElement.textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
        
        // Create types div
        const typesDiv = document.createElement('div');
        typesDiv.className = 'card-types';
        
        pokemon.types.forEach(type => {
            const typeSpan = document.createElement('span');
            typeSpan.textContent = type;
            typeSpan.className = `type-badge ${type}`;
            typesDiv.appendChild(typeSpan);
        });
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-button';
        deleteBtn.textContent = 'Remove';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            deletePokemon(pokemon._uuid);
        });
        
        // Append elements to card info
        cardInfo.appendChild(nameElement);
        cardInfo.appendChild(idElement);
        cardInfo.appendChild(typesDiv);
        
        // Append all elements to card
        card.appendChild(cardImage);
        card.appendChild(cardInfo);
        card.appendChild(deleteBtn);
        
        // Add click event to show details
        card.addEventListener('click', () => {
            showPokemonDetails(pokemon);
        });
        
        collectionList.appendChild(card);
    });
}

// Show Pokémon details in modal
function showPokemonDetails(pokemon) {
    // Create detail content
    modalDetails.innerHTML = '';
    
    // Create header with image and basic info
    const detailHeader = document.createElement('div');
    detailHeader.className = 'pokemon-header';
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'pokemon-image-container';
    
    const detailImage = document.createElement('img');
    detailImage.src = pokemon.image;
    detailImage.alt = pokemon.name;
    detailImage.onerror = function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJBMzM0MCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNTAiIGZpbGw9IiM0YTU1NjgiLz48L3N2Zz4=';
    };
    
    imageContainer.appendChild(detailImage);
    
    // Create details div
    const detailInfo = document.createElement('div');
    detailInfo.className = 'pokemon-details';
    
    // Name and ID
    const nameHeader = document.createElement('h2');
    nameHeader.textContent = pokemon.name;
    
    const idDiv = document.createElement('div');
    idDiv.className = 'pokemon-id';
    idDiv.innerHTML = `#<span>${pokemon.id.toString().padStart(3, '0')}</span>`;
    
    // Types
    const typesDiv = document.createElement('div');
    typesDiv.className = 'pokemon-types';
    
    pokemon.types.forEach(type => {
        const typeSpan = document.createElement('span');
        typeSpan.textContent = type;
        typeSpan.className = `type-badge ${type}`;
        typesDiv.appendChild(typeSpan);
    });
    
    // Stats
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-container';
    
    const statsHeader = document.createElement('h3');
    statsHeader.textContent = 'Base Stats';
    statsContainer.appendChild(statsHeader);
    
    const statsListDiv = document.createElement('div');
    statsListDiv.className = 'stats-list';
    
    // Add each stat
    const statNames = {
        'hp': 'HP',
        'attack': 'Attack',
        'defense': 'Defense',
        'special-attack': 'Sp. Atk',
        'special-defense': 'Sp. Def',
        'speed': 'Speed'
    };
    
    for (const [statName, value] of Object.entries(pokemon.stats)) {
        const statBar = document.createElement('div');
        statBar.className = 'stat-bar';
        
        const statNameDiv = document.createElement('div');
        statNameDiv.className = 'stat-name';
        statNameDiv.textContent = statNames[statName] || statName;
        
        const statValueDiv = document.createElement('div');
        statValueDiv.className = 'stat-value';
        statValueDiv.textContent = value;
        
        const statBarContainer = document.createElement('div');
        statBarContainer.className = 'stat-bar-container';
        
        const statBarFill = document.createElement('div');
        statBarFill.className = 'stat-bar-fill';
        
        // Set stat bar color based on value
        const statPercentage = (value / 255) * 100;
        statBarFill.style.width = `${statPercentage}%`;
        
        if (value < 50) {
            statBarFill.style.backgroundColor = '#ff7675';
        } else if (value < 100) {
            statBarFill.style.backgroundColor = '#fdcb6e';
        } else {
            statBarFill.style.backgroundColor = '#00b894';
        }
        
        statBarContainer.appendChild(statBarFill);
        statBar.appendChild(statNameDiv);
        statBar.appendChild(statValueDiv);
        statBar.appendChild(statBarContainer);
        statsListDiv.appendChild(statBar);
    }
    
    statsContainer.appendChild(statsListDiv);
    
    // Date added info
    const dateAddedDiv = document.createElement('div');
    dateAddedDiv.className = 'date-added';
    
    const addedDate = new Date(pokemon.dateAdded);
    const formattedDate = addedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dateAddedDiv.textContent = `Added to collection: ${formattedDate}`;
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Remove from Collection';
    deleteBtn.addEventListener('click', () => {
        deletePokemon(pokemon._uuid);
    });
    
    // Append all elements
    detailInfo.appendChild(nameHeader);
    detailInfo.appendChild(idDiv);
    detailInfo.appendChild(typesDiv);
    detailInfo.appendChild(statsContainer);
    detailInfo.appendChild(dateAddedDiv);
    detailInfo.appendChild(deleteBtn);
    
    detailHeader.appendChild(imageContainer);
    detailHeader.appendChild(detailInfo);
    
    modalDetails.appendChild(detailHeader);
    
    // Show modal
    pokemonModal.style.display = 'block';
}

// Close modal
function closeModal() {
    pokemonModal.style.display = 'none';
}

// Toggle advanced filters visibility
function toggleAdvancedFilters() {
    const isVisible = advancedFiltersContent.style.display !== 'none';
    advancedFiltersContent.style.display = isVisible ? 'none' : 'block';
    toggleAdvancedFiltersBtn.textContent = isVisible ? 'Advanced Filters ▼' : 'Advanced Filters ▲';
}

// Clear all filters
function clearFilters() {
    collectionSearch.value = '';
    typeFilter.value = '';
    sortByFilter.value = 'id-asc';
    renderCollection();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load collection from localStorage
    loadCollection();
    
    // Collection filters
    collectionSearch.addEventListener('input', renderCollection);
    typeFilter.addEventListener('change', renderCollection);
    sortByFilter.addEventListener('change', renderCollection);
    
    // Clear filters button
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Toggle advanced filters
    toggleAdvancedFiltersBtn.addEventListener('click', toggleAdvancedFilters);
    
    // Modal close button
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === pokemonModal) {
            closeModal();
        }
    });
});