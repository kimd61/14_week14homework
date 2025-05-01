// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error-message');
const pokemonGrid = document.getElementById('pokemon-grid');
const loadingGrid = document.getElementById('loading-grid');
const typeFilter = document.getElementById('type-filter');
const pokemonModal = document.getElementById('pokemon-modal');
const modalDetails = document.getElementById('modal-details');
const closeModalBtn = document.querySelector('.close');

// Constants
const POKE_API_URL = 'https://pokeapi.co/api/v2';
const STORAGE_KEY = 'pokemon_tracker_collection';
const LIMIT = 20;

// State variables
let currentPokemon = null;
let offset = 0;
let collection = [];
let allPokemon = [];
let isLoading = false;

// Load collection from localStorage
function loadCollection() {
    try {
        const storedCollection = localStorage.getItem(STORAGE_KEY);
        if (storedCollection) {
            collection = JSON.parse(storedCollection);
        }
    } catch (error) {
        console.error('Error loading collection from localStorage:', error);
        errorElement.textContent = 'Failed to load your Pokémon collection.';
        errorElement.style.display = 'block';
    }
}

// Save collection to localStorage
function saveCollection() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (error) {
        console.error('Error saving collection to localStorage:', error);
        errorElement.textContent = 'Failed to save your Pokémon collection.';
        errorElement.style.display = 'block';
    }
}

// Generate a unique ID for each Pokémon in collection
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Search for a Pokémon
async function searchPokemon() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        errorElement.textContent = 'Please enter a Pokémon name or ID.';
        errorElement.style.display = 'block';
        return;
    }
    
    // Show loading
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
    
    try {
        // Fetch data from PokeAPI
        const response = await fetch(`${POKE_API_URL}/pokemon/${query}`);
        
        if (!response.ok) {
            throw new Error(`Pokémon not found: ${query}`);
        }
        
        const data = await response.json();
        currentPokemon = data;
        
        // Show details modal
        showPokemonDetails(data);
    } catch (error) {
        console.error('Error:', error);
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
        currentPokemon = null;
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Load initial Pokémon grid
async function loadPokemonGrid(reset = false) {
    if (isLoading) return;
    isLoading = true;
    
    // Reset grid if needed
    if (reset) {
        // Get the filter card
        const filterCard = document.querySelector('.filter-card');
        
        // Clear grid but preserve the filter card
        pokemonGrid.innerHTML = '';
        if (filterCard) {
            pokemonGrid.appendChild(filterCard);
        }
        
        offset = 0;
    }
    
    // Show loading
    const loadingText = document.getElementById('loading-grid');
    
    // If loading element doesn't exist (might have been cleared), create a new one
    if (!loadingText) {
        const newLoadingText = document.createElement('p');
        newLoadingText.id = 'loading-grid';
        newLoadingText.className = 'loading-message';
        newLoadingText.textContent = 'Loading Pokémon...';
        newLoadingText.style.display = 'block';
        
        // Append after filter card
        const filterCard = document.querySelector('.filter-card');
        if (filterCard) {
            filterCard.after(newLoadingText);
        } else {
            pokemonGrid.appendChild(newLoadingText);
        }
    } else {
        loadingText.style.display = 'block';
    }
    
    try {
        // Get type filter value
        const typeValue = typeFilter.value;
        
        if (typeValue && reset) {
            // Load Pokémon by type
            await loadPokemonByType(typeValue);
        } else if (reset) {
            // Reset and load all Pokémon 
            allPokemon = [];
            await loadAllPokemon();
        } else if (allPokemon.length > 0) {
            // Load more Pokémon from existing list
            await renderPokemonBatch();
        } else {
            // Initial load
            await loadAllPokemon();
        }
    } catch (error) {
        console.error('Error loading Pokémon grid:', error);
        const errorMsg = document.createElement('p');
        errorMsg.className = 'no-results';
        errorMsg.textContent = 'Failed to load Pokémon. Please try again later.';
        pokemonGrid.appendChild(errorMsg);
    } finally {
        // Hide loading message
        const loadingText = document.getElementById('loading-grid');
        if (loadingText) {
            loadingText.style.display = 'none';
        }
        isLoading = false;
    }
}

// Load Pokémon by type
async function loadPokemonByType(type) {
    try {
        // Fetch Pokémon of the selected type
        const response = await fetch(`${POKE_API_URL}/type/${type}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Pokémon of type: ${type}`);
        }
        
        const data = await response.json();
        
        // Extract Pokémon from the response
        allPokemon = data.pokemon.map(p => ({ 
            name: p.pokemon.name, 
            url: p.pokemon.url 
        }));
        
        renderPokemonBatch();
    } catch (error) {
        console.error('Error loading Pokémon by type:', error);
        throw error;
    }
}

// Load all Pokémon (paginated list)
async function loadAllPokemon() {
    try {
        // Fetch initial Pokémon list
        const response = await fetch(`${POKE_API_URL}/pokemon?limit=100&offset=0`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch Pokémon list');
        }
        
        const data = await response.json();
        
        // Store all Pokémon
        allPokemon = data.results;
        
        // Render the first batch
        renderPokemonBatch();
    } catch (error) {
        console.error('Error loading all Pokémon:', error);
        throw error;
    }
}

// Render a batch of Pokémon cards
async function renderPokemonBatch() {
    if (offset >= allPokemon.length) {
        loadMoreButton.disabled = true;
        loadMoreButton.textContent = 'No More Pokémon';
        return;
    }
    
    const batch = allPokemon.slice(offset, offset + LIMIT);
    offset += LIMIT;
    
    const pokemonPromises = batch.map(pokemon => {
        // Extract ID from URL or make a separate fetch for detailed info
        const urlParts = pokemon.url.split('/');
        const id = urlParts[urlParts.length - 2];
        return fetch(`${POKE_API_URL}/pokemon/${id}`).then(res => res.json());
    });
    
    // Show loading message
    loadingGrid.style.display = 'block';
    
    try {
        // Fetch details for all Pokémon in the batch
        const pokemonDetails = await Promise.all(pokemonPromises);
        
        // Create cards for each Pokémon
        pokemonDetails.forEach(pokemon => {
            createPokemonCard(pokemon);
        });
        
        // Update button state
        loadMoreButton.disabled = false;
        loadMoreButton.textContent = 'Load More';
    } catch (error) {
        console.error('Error fetching Pokémon details:', error);
    } finally {
        loadingGrid.style.display = 'none';
    }
    
    // Add a load more button at the bottom if we have more to load
    if (offset < allPokemon.length) {
        addBottomLoadMoreButton();
    }
}

// Create a Pokémon card
function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.dataset.id = pokemon.id;
    
    // Check if Pokémon is in collection
    const isInCollection = collection.some(p => p.id === pokemon.id);
    
    // Create card content
    const cardImage = document.createElement('img');
    cardImage.className = 'pokemon-card-image';
    cardImage.src = pokemon.sprites.other['official-artwork'].front_default || 
                   pokemon.sprites.front_default;
    cardImage.alt = pokemon.name;
    cardImage.loading = 'lazy';
    
    cardImage.onerror = function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJBMzM0MCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNTAiIGZpbGw9IiM0YTU1NjgiLz48L3N2Zz4=';
    };
    
    const cardId = document.createElement('div');
    cardId.className = 'pokemon-card-id';
    cardId.textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
    
    const cardName = document.createElement('div');
    cardName.className = 'pokemon-card-name';
    cardName.textContent = pokemon.name;
    
    const typesDiv = document.createElement('div');
    typesDiv.className = 'pokemon-card-types';
    
    pokemon.types.forEach(typeInfo => {
        const typeElement = document.createElement('span');
        typeElement.textContent = typeInfo.type.name;
        typeElement.className = `type-badge ${typeInfo.type.name}`;
        typesDiv.appendChild(typeElement);
    });
    
    const saveButton = document.createElement('button');
    saveButton.className = `save-button ${isInCollection ? 'saved' : ''}`;
    saveButton.textContent = isInCollection ? 'In Collection' : 'Add to Collection';
    saveButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        toggleSavePokemon(pokemon, saveButton);
    });
    
    // Add card elements
    card.appendChild(cardId);
    card.appendChild(cardImage);
    card.appendChild(cardName);
    card.appendChild(typesDiv);
    card.appendChild(saveButton);
    
    // Add click handler to show details
    card.addEventListener('click', () => {
        showPokemonDetails(pokemon);
    });
    
    // Add card to grid
    pokemonGrid.appendChild(card);
}

// Toggle save/unsave Pokémon
function toggleSavePokemon(pokemon, buttonElement) {
    // Check if Pokémon is already in collection
    const existingIndex = collection.findIndex(p => p.id === pokemon.id);
    
    if (existingIndex !== -1) {
        // Ask for confirmation before removing
        if (confirm(`Remove ${pokemon.name} from your collection?`)) {
            // Remove from collection
            collection.splice(existingIndex, 1);
            
            // Update button
            buttonElement.textContent = 'Add to Collection';
            buttonElement.classList.remove('saved');
        }
    } else {
        // Create a simplified Pokémon object for storage
        const pokemonToSave = {
            _uuid: generateUUID(),
            id: pokemon.id,
            name: pokemon.name,
            image: pokemon.sprites.other['official-artwork'].front_default || 
                  pokemon.sprites.front_default,
            types: pokemon.types.map(t => t.type.name),
            stats: pokemon.stats.reduce((obj, stat) => {
                obj[stat.stat.name] = stat.base_stat;
                return obj;
            }, {}),
            dateAdded: new Date().toISOString()
        };
        
        // Add to collection
        collection.push(pokemonToSave);
        
        // Update button
        buttonElement.textContent = 'In Collection';
        buttonElement.classList.add('saved');
    }
    
    // Save to localStorage
    saveCollection();
}

// Show Pokémon details in modal
function showPokemonDetails(pokemon) {
    // Create detail content
    modalDetails.innerHTML = '';
    
    // Check if Pokémon is in collection
    const isInCollection = collection.some(p => p.id === pokemon.id);
    
    // Create header with image and basic info
    const detailHeader = document.createElement('div');
    detailHeader.className = 'pokemon-header';
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'pokemon-image-container';
    
    const detailImage = document.createElement('img');
    detailImage.src = pokemon.sprites.other['official-artwork'].front_default || 
                      pokemon.sprites.front_default;
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
    
    pokemon.types.forEach(typeInfo => {
        const typeSpan = document.createElement('span');
        typeSpan.textContent = typeInfo.type.name;
        typeSpan.className = `type-badge ${typeInfo.type.name}`;
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
    
    pokemon.stats.forEach(statInfo => {
        const statBar = document.createElement('div');
        statBar.className = 'stat-bar';
        
        const statName = document.createElement('div');
        statName.className = 'stat-name';
        statName.textContent = statInfo.stat.name.replace('-', ' ');
        
        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.textContent = statInfo.base_stat;
        
        const statBarContainer = document.createElement('div');
        statBarContainer.className = 'stat-bar-container';
        
        const statBarFill = document.createElement('div');
        statBarFill.className = 'stat-bar-fill';
        
        // Set stat bar color based on value
        const statPercentage = (statInfo.base_stat / 255) * 100;
        statBarFill.style.width = `${statPercentage}%`;
        
        if (statInfo.base_stat < 50) {
            statBarFill.style.backgroundColor = '#ff7675';
        } else if (statInfo.base_stat < 100) {
            statBarFill.style.backgroundColor = '#fdcb6e';
        } else {
            statBarFill.style.backgroundColor = '#00b894';
        }
        
        statBarContainer.appendChild(statBarFill);
        statBar.appendChild(statName);
        statBar.appendChild(statValue);
        statBar.appendChild(statBarContainer);
        statsListDiv.appendChild(statBar);
    });
    
    statsContainer.appendChild(statsListDiv);
    
    // Abilities
    const abilitiesContainer = document.createElement('div');
    abilitiesContainer.className = 'abilities-container';
    
    const abilitiesHeader = document.createElement('h3');
    abilitiesHeader.textContent = 'Abilities';
    abilitiesContainer.appendChild(abilitiesHeader);
    
    const abilitiesList = document.createElement('ul');
    abilitiesList.className = 'abilities-list';
    
    pokemon.abilities.forEach(abilityInfo => {
        const abilityItem = document.createElement('li');
        
        if (abilityInfo.is_hidden) {
            abilityItem.innerHTML = `${abilityInfo.ability.name} <span class="ability-hidden">(Hidden)</span>`;
        } else {
            abilityItem.textContent = abilityInfo.ability.name;
        }
        
        abilitiesList.appendChild(abilityItem);
    });
    
    abilitiesContainer.appendChild(abilitiesList);
    
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = `btn-save ${isInCollection ? 'saved' : ''}`;
    saveBtn.textContent = isInCollection ? 'Remove from Collection' : 'Add to Collection';
    saveBtn.addEventListener('click', () => {
        // Find and update the corresponding grid button if it exists
        const card = document.querySelector(`.pokemon-card[data-id="${pokemon.id}"]`);
        const cardButton = card ? card.querySelector('.save-button') : null;
        
        toggleSavePokemon(pokemon, saveBtn);
        
        // Update button text and class
        if (saveBtn.classList.contains('saved')) {
            saveBtn.textContent = 'Remove from Collection';
        } else {
            saveBtn.textContent = 'Add to Collection';
        }
        
        // Update card button if it exists
        if (cardButton) {
            cardButton.textContent = saveBtn.classList.contains('saved') ? 'In Collection' : 'Add to Collection';
            if (saveBtn.classList.contains('saved')) {
                cardButton.classList.add('saved');
            } else {
                cardButton.classList.remove('saved');
            }
        }
    });
    
    // Append all elements
    detailInfo.appendChild(nameHeader);
    detailInfo.appendChild(idDiv);
    detailInfo.appendChild(typesDiv);
    detailInfo.appendChild(statsContainer);
    detailInfo.appendChild(abilitiesContainer);
    detailInfo.appendChild(saveBtn);
    
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load collection from localStorage
    loadCollection();
    
    // Load initial Pokémon grid
    loadPokemonGrid();
    
    // Search button click
    searchButton.addEventListener('click', searchPokemon);
    
    // Search input enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPokemon();
        }
    });
    
    // Type filter change
    typeFilter.addEventListener('change', () => {
        loadPokemonGrid(true); // Reset and load filtered Pokémon
    });
    
    // We've removed the top load more button
    // The functionality is now in the bottom load more button only
    
    // Modal close button
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === pokemonModal) {
            closeModal();
        }
    });
});

// Function to add a Load More button at the bottom of the grid
function addBottomLoadMoreButton() {
    // Remove any existing bottom load more button
    const existingBottomButton = document.getElementById('bottom-load-more');
    if (existingBottomButton) {
        existingBottomButton.parentElement.remove();
    }
    
    // Create a div that will be placed outside the grid
    const bottomButtonContainer = document.createElement('div');
    bottomButtonContainer.className = 'bottom-load-more-container';
    bottomButtonContainer.style.textAlign = 'center';
    bottomButtonContainer.style.margin = '30px 0';
    
    const bottomLoadMoreButton = document.createElement('button');
    bottomLoadMoreButton.id = 'bottom-load-more';
    bottomLoadMoreButton.className = 'btn-load';
    bottomLoadMoreButton.textContent = 'Load More Pokémon';
    bottomLoadMoreButton.addEventListener('click', () => {
        loadPokemonGrid(false); // Load more without resetting
    });
    
    bottomButtonContainer.appendChild(bottomLoadMoreButton);
    
    // Insert after the pokemonGrid instead of inside it
    pokemonGrid.parentNode.insertBefore(bottomButtonContainer, pokemonGrid.nextSibling);
}