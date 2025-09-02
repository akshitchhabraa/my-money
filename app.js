// My Money - AI-Enhanced Financial Management Application
// CORRECTED VERSION WITH FULL AI INTEGRATION

class FinanceApp {
    constructor() {
        console.log('🚀 Initializing AI-Powered My Money System');
        
        // Initialize application state
        this.transactions = this.loadFromStorage('transactions', []);
        this.customers = this.loadFromStorage('customers', []);
        this.businessTransactions = this.loadFromStorage('businessTransactions', []);
        
        // Application state management
        this.currentView = 'homepage';
        this.currentCustomer = null;
        this.editingTransactionId = null;
        this.editingBusinessTransactionId = null;
        this.editingCustomerId = null;
        this.currentFilters = null;
        this.expenseChart = null;
        this.transactionToDelete = null;
        
        // AI categorization state
        this.aiSuggestion = null;
        this.aiConfidence = 0;
        this.lastDescription = '';
        this.aiTimeout = null;
        
        // Flask API endpoints configuration
        this.apiEndpoints = {
            transactions: '/api/transactions',
            customers: '/api/customers',
            businessTransactions: '/api/khatabook/transactions',
            reports: '/api/reports',
            aiCategorize: '/api/ai/categorize-transaction',
            aiLearn: '/api/ai/learn-correction',
            aiInsights: '/api/ai/spending-insights'
        };
        
        // Set current date for forms
        this.currentDate = new Date().toISOString().split('T')[0];
        
        // Global reference for event handlers
        window.app = this;
        
        // Initialize application
        this.init();
    }

    init() {
        console.log('⚙️ Setting up AI-enhanced application...');
        
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('🔧 Setting up AI event listeners and initial state');
        try {
            this.setupEventListeners();
            this.setupAIIntegration();
            this.initializeForms();
            this.updateAllDisplays();
            console.log('✅ AI-Enhanced Application initialized successfully');
        } catch (error) {
            console.error('❌ Error during setup:', error);
            this.showError('Failed to initialize application');
        }
    }

    // AI INTEGRATION SETUP
    setupAIIntegration() {
        console.log('🤖 Setting up AI categorization integration...');
        
        // Personal finance description field AI integration
        const descriptionField = document.getElementById('transaction-description');
        if (descriptionField) {
            descriptionField.addEventListener('input', (e) => {
                this.handleAIDescriptionInput(e.target.value);
            });
            
            descriptionField.addEventListener('blur', () => {
                this.handleAIDescriptionBlur();
            });
        }
        
        // Business transaction description field AI integration
        const businessDescriptionField = document.getElementById('business-transaction-description');
        if (businessDescriptionField) {
            businessDescriptionField.addEventListener('input', (e) => {
                this.handleAIDescriptionInput(e.target.value, true);
            });
        }

        // Category change listener for learning
        const categoryField = document.getElementById('transaction-category');
        if (categoryField) {
            categoryField.addEventListener('change', (e) => {
                this.handleCategoryChange(e.target.value);
            });
        }

        console.log('✅ AI Integration setup complete');
    }

    // AI CATEGORIZATION METHODS
    async handleAIDescriptionInput(description, isBusiness = false) {
        // Clear previous timeout
        if (this.aiTimeout) {
            clearTimeout(this.aiTimeout);
        }

        // Don't trigger for very short descriptions
        if (description.trim().length < 3) {
            this.clearAISuggestion();
            return;
        }

        // Debounce AI calls
        this.aiTimeout = setTimeout(async () => {
            await this.getAICategorySuggestion(description, isBusiness);
        }, 500);
    }

    async getAICategorySuggestion(description, isBusiness = false) {
        try {
            console.log('🤖 Getting AI category suggestion for:', description);
            
            // Show loading indicator
            this.showAILoading(isBusiness);
            
            const response = await fetch(this.apiEndpoints.aiCategorize, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: description,
                    user_id: 'demo_user'
                })
            });

            if (!response.ok) {
                throw new Error(`AI API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.suggestion) {
                this.displayAISuggestion(data.suggestion, isBusiness);
                console.log('✅ AI suggestion received:', data.suggestion);
            } else {
                throw new Error('No AI suggestion received');
            }
            
        } catch (error) {
            console.error('❌ AI categorization error:', error);
            this.clearAISuggestion();
            // Don't show error to user for AI failures, just fail silently
        } finally {
            this.hideAILoading(isBusiness);
        }
    }

    displayAISuggestion(suggestion, isBusiness = false) {
        const categoryFieldId = isBusiness ? 'business-transaction-category' : 'transaction-category';
        const categoryField = document.getElementById(categoryFieldId);
        
        if (!categoryField) return;

        // Store AI suggestion
        this.aiSuggestion = suggestion;
        this.aiConfidence = suggestion.confidence;

        // Auto-select the suggested category
        if (suggestion.suggested_category && suggestion.confidence > 0.5) {
            categoryField.value = suggestion.suggested_category;
            
            // Trigger change event to update any dependent elements
            categoryField.dispatchEvent(new Event('change'));
        }

        // Show AI confidence indicator
        this.showAIConfidence(suggestion, isBusiness);
    }

    showAIConfidence(suggestion, isBusiness = false) {
        const indicatorId = isBusiness ? 'business-ai-confidence' : 'ai-confidence-indicator';
        let indicator = document.getElementById(indicatorId);
        
        // Create indicator if it doesn't exist
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = indicatorId;
            indicator.className = 'ai-confidence-indicator';
            
            const categoryFieldId = isBusiness ? 'business-transaction-category' : 'transaction-category';
            const categoryField = document.getElementById(categoryFieldId);
            if (categoryField && categoryField.parentNode) {
                categoryField.parentNode.appendChild(indicator);
            }
        }

        const confidence = Math.round(suggestion.confidence * 100);
        const confidenceClass = confidence > 70 ? 'high' : confidence > 40 ? 'medium' : 'low';
        
        indicator.innerHTML = `
            <div class="ai-suggestion ${confidenceClass}">
                🤖 AI suggests: <strong>${suggestion.suggested_category}</strong> 
                <span class="confidence">(${confidence}% confident)</span>
            </div>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (indicator) indicator.style.opacity = '0.7';
        }, 5000);
    }

    showAILoading(isBusiness = false) {
        const indicatorId = isBusiness ? 'business-ai-loading' : 'ai-loading-indicator';
        let indicator = document.getElementById(indicatorId);
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = indicatorId;
            indicator.className = 'ai-loading-indicator';
            
            const categoryFieldId = isBusiness ? 'business-transaction-category' : 'transaction-category';
            const categoryField = document.getElementById(categoryFieldId);
            if (categoryField && categoryField.parentNode) {
                categoryField.parentNode.appendChild(indicator);
            }
        }

        indicator.innerHTML = `
            <div class="ai-loading">
                🤖 <span class="loading-dots">Thinking</span>
            </div>
        `;
        indicator.style.display = 'block';
    }

    hideAILoading(isBusiness = false) {
        const indicatorId = isBusiness ? 'business-ai-loading' : 'ai-loading-indicator';
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    clearAISuggestion() {
        this.aiSuggestion = null;
        this.aiConfidence = 0;
        
        // Clear confidence indicators
        ['ai-confidence-indicator', 'business-ai-confidence'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = '';
        });
    }

    async handleCategoryChange(selectedCategory) {
        // If user manually changed category different from AI suggestion, learn from it
        if (this.aiSuggestion && 
            selectedCategory !== this.aiSuggestion.suggested_category && 
            this.lastDescription.trim().length > 0) {
            
            await this.teachAI(this.lastDescription, selectedCategory);
        }
    }

    async teachAI(description, correctCategory) {
        try {
            console.log('📚 Teaching AI: description =', description, ', correct category =', correctCategory);
            
            const response = await fetch(this.apiEndpoints.aiLearn, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: description,
                    correct_category: correctCategory,
                    user_id: 'demo_user'
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('✅ AI learned from correction');
                    this.showInfo('🤖 AI learned from your correction and will improve!');
                }
            }
            
        } catch (error) {
            console.error('❌ Error teaching AI:', error);
        }
    }

    handleAIDescriptionBlur() {
        const descriptionField = document.getElementById('transaction-description');
        if (descriptionField) {
            this.lastDescription = descriptionField.value;
        }
    }

    // EVENT LISTENERS SETUP
    setupEventListeners() {
        this.setupNavigationEvents();
        this.setupPersonalFinanceEvents();
        this.setupBusinessEvents();
        this.setupModalEvents();
        this.setupKeyboardShortcuts();
    }

    setupNavigationEvents() {
        // Homepage navigation
        const personalOption = document.getElementById('personal-option');
        const businessOption = document.getElementById('business-option');
        
        if (personalOption) {
            personalOption.addEventListener('click', () => this.showView('personal'));
        }
        
        if (businessOption) {
            businessOption.addEventListener('click', () => this.showView('business'));
        }
        
        // Back navigation buttons
        this.setupBackButtons();
    }

    setupBackButtons() {
        const backButtons = {
            'back-to-home': 'homepage',
            'back-to-home-business': 'homepage',
            'back-to-business': 'business'
        };
        
        Object.entries(backButtons).forEach(([id, view]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => this.showView(view));
            }
        });
    }

    setupPersonalFinanceEvents() {
        // Transaction form
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }

        // Form controls
        const cancelEdit = document.getElementById('cancel-edit');
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.cancelTransactionEdit());
        }

        // Filter controls
        const applyFilters = document.getElementById('apply-filters');
        const clearFilters = document.getElementById('clear-filters');
        
        if (applyFilters) {
            applyFilters.addEventListener('click', () => this.applyFilters());
        }
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
        }

        // Real-time amount validation
        const amountField = document.getElementById('transaction-amount');
        if (amountField) {
            amountField.addEventListener('input', () => this.validateAmountField(amountField));
        }
    }

    setupBusinessEvents() {
        // Customer management
        const addCustomerBtn = document.getElementById('add-customer-btn');
        const viewAllCustomersBtn = document.getElementById('view-all-customers-btn');
        const outstandingBalancesBtn = document.getElementById('outstanding-balances-btn');
        
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => this.showAddCustomerModal());
        }
        if (viewAllCustomersBtn) {
            viewAllCustomersBtn.addEventListener('click', () => this.showAllCustomers());
        }
        if (outstandingBalancesBtn) {
            outstandingBalancesBtn.addEventListener('click', () => this.showOutstandingBalances());
        }

        // Customer search
        const customerSearch = document.getElementById('customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => this.searchCustomers(e.target.value));
        }

        // Business transaction form
        const businessForm = document.getElementById('business-transaction-form');
        if (businessForm) {
            businessForm.addEventListener('submit', (e) => this.handleBusinessTransactionSubmit(e));
        }

        const businessCancelEdit = document.getElementById('business-cancel-edit');
        if (businessCancelEdit) {
            businessCancelEdit.addEventListener('click', () => this.cancelBusinessTransactionEdit());
        }

        // Real-time amount validation for business form
        const businessAmountField = document.getElementById('business-transaction-amount');
        if (businessAmountField) {
            businessAmountField.addEventListener('input', () => this.validateAmountField(businessAmountField));
        }
    }

    setupModalEvents() {
        // Customer modal
        const cancelCustomer = document.getElementById('cancel-customer');
        const saveCustomer = document.getElementById('save-customer');
        const customerModal = document.getElementById('add-customer-modal');
        
        if (cancelCustomer) {
            cancelCustomer.addEventListener('click', () => this.hideAddCustomerModal());
        }
        if (saveCustomer) {
            saveCustomer.addEventListener('click', () => this.handleAddCustomer());
        }
        if (customerModal) {
            customerModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.hideAddCustomerModal();
                }
            });
        }

        // Delete modal
        const cancelDelete = document.getElementById('cancel-delete');
        const confirmDelete = document.getElementById('confirm-delete');
        const deleteModal = document.getElementById('delete-modal');
        
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDelete());
        }
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.hideDeleteModal();
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
            
            // Form submission shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.handleFormSubmissionShortcut();
            }
            
            // Navigation shortcuts
            if (e.altKey && !isNaN(e.key)) {
                this.handleNavigationShortcut(e.key);
            }
        });
    }

    handleEscapeKey() {
        // Close modals or cancel edits
        const deleteModal = document.getElementById('delete-modal');
        const customerModal = document.getElementById('add-customer-modal');
        
        if (deleteModal && !deleteModal.classList.contains('hidden')) {
            this.hideDeleteModal();
        } else if (customerModal && !customerModal.classList.contains('hidden')) {
            this.hideAddCustomerModal();
        } else if (this.editingTransactionId) {
            this.cancelTransactionEdit();
        } else if (this.editingBusinessTransactionId) {
            this.cancelBusinessTransactionEdit();
        }
    }

    handleFormSubmissionShortcut() {
        const activeElement = document.activeElement;
        if (activeElement) {
            const transactionForm = document.getElementById('transaction-form');
            const businessForm = document.getElementById('business-transaction-form');
            
            if (transactionForm && transactionForm.contains(activeElement)) {
                this.handleTransactionSubmit(new Event('submit'));
            } else if (businessForm && businessForm.contains(activeElement)) {
                this.handleBusinessTransactionSubmit(new Event('submit'));
            }
        }
    }

    handleNavigationShortcut(key) {
        const shortcuts = {
            '1': 'homepage',
            '2': 'personal',
            '3': 'business'
        };
        
        if (shortcuts[key]) {
            this.showView(shortcuts[key]);
        }
    }

    // VIEW MANAGEMENT
    showView(viewName) {
        console.log(`🔄 Switching to view: ${viewName}`);
        try {
            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.add('hidden');
                view.classList.remove('active');
            });
            
            // Show target view
            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) {
                targetView.classList.remove('hidden');
                targetView.classList.add('active');
                this.currentView = viewName;
                
                // Update display for new view
                setTimeout(() => {
                    this.updateAllDisplays();
                    if (viewName === 'personal') {
                        this.initializeChart();
                    }
                }, 100);
                
                console.log(`✅ Successfully switched to view: ${viewName}`);
            } else {
                throw new Error(`View not found: ${viewName}`);
            }
        } catch (error) {
            console.error(`❌ Error switching to view ${viewName}:`, error);
            this.showError(`Failed to switch to ${viewName} view`);
        }
    }

    // FORM INITIALIZATION
    initializeForms() {
        // Set current date in all date fields
        const dateFields = [
            'transaction-date',
            'business-transaction-date'
        ];
        
        dateFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = this.currentDate;
            }
        });
    }

    // PERSONAL FINANCE METHODS
    async handleTransactionSubmit(e) {
        e.preventDefault();
        console.log('📝 Processing personal finance transaction with AI...');
        
        try {
            this.showLoading('submit-btn');
            
            const formData = this.getTransactionFormData();
            if (!this.validateTransactionForm(formData)) {
                this.hideLoading('submit-btn');
                return false;
            }

            // Enhanced API call to Flask backend
            const response = await fetch(this.apiEndpoints.transactions, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update local storage
                    this.transactions.push(data.transaction);
                    this.saveToStorage('transactions', this.transactions);
                    
                    if (this.editingTransactionId) {
                        this.showSuccess('Transaction updated successfully!');
                    } else {
                        this.showSuccess('Transaction added successfully! 🤖 AI learned your preferences.');
                    }
                    
                    this.resetTransactionForm();
                    this.updateAllDisplays();
                } else {
                    throw new Error(data.message || 'Failed to save transaction');
                }
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error handling transaction:', error);
            this.showError('Failed to save transaction. Please try again.');
        } finally {
            this.hideLoading('submit-btn');
        }
    }

    getTransactionFormData() {
        return {
            date: document.getElementById('transaction-date')?.value || '',
            amount: parseFloat(document.getElementById('transaction-amount')?.value || '0'),
            type: document.getElementById('transaction-type')?.value || '',
            category: document.getElementById('transaction-category')?.value || '',
            description: document.getElementById('transaction-description')?.value?.trim() || ''
        };
    }

    validateTransactionForm(data) {
        this.clearFormErrors();
        let isValid = true;
        
        const validations = [
            { field: 'transaction-date', condition: !data.date, message: 'Date is required' },
            { field: 'transaction-amount', condition: !data.amount || data.amount <= 0, message: 'Amount must be greater than ₹0.00' },
            { field: 'transaction-type', condition: !data.type, message: 'Transaction type is required' },
            { field: 'transaction-category', condition: !data.category, message: 'Category is required' },
            { field: 'transaction-description', condition: !data.description, message: 'Description is required' }
        ];
        
        validations.forEach(validation => {
            if (validation.condition) {
                this.showFieldError(validation.field, validation.message);
                isValid = false;
            }
        });
        
        return isValid;
    }

    resetTransactionForm() {
        const form = document.getElementById('transaction-form');
        const dateField = document.getElementById('transaction-date');
        
        if (form) form.reset();
        if (dateField) dateField.value = this.currentDate;
        
        this.updateFormUI('form-title', 'Add New Transaction', 'submit-btn', 'Add Transaction', 'cancel-edit', true);
        this.editingTransactionId = null;
        this.clearFormErrors();
        this.clearAISuggestion();
    }

    // UTILITY METHODS
    updateFormUI(titleId, titleText, buttonId, buttonText, cancelId, hideCancelButton) {
        const title = document.getElementById(titleId);
        const button = document.getElementById(buttonId);
        const cancel = document.getElementById(cancelId);
        
        if (title) title.textContent = titleText;
        if (button) button.textContent = buttonText;
        if (cancel) {
            cancel.classList.toggle('hidden', hideCancelButton);
        }
    }

    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="loading-spinner"></span> Processing...';
        }
    }

    hideLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            // Reset button text based on context
            if (buttonId === 'submit-btn') {
                button.textContent = this.editingTransactionId ? 'Update Transaction' : 'Add Transaction';
            } else if (buttonId === 'business-submit-btn') {
                button.textContent = this.editingBusinessTransactionId ? 'Update Transaction' : 'Record Transaction';
            }
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                ${message}
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    clearFormErrors() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            const error = document.createElement('div');
            error.className = 'field-error';
            error.textContent = message;
            field.parentNode.appendChild(error);
        }
    }

    validateAmountField(field) {
        const value = parseFloat(field.value);
        if (isNaN(value) || value <= 0) {
            field.classList.add('invalid');
        } else {
            field.classList.remove('invalid');
        }
    }

    updateAllDisplays() {
        try {
            if (this.currentView === 'personal') {
                this.updatePersonalFinanceDisplay();
            } else if (this.currentView === 'business') {
                this.updateBusinessDisplay();
            }
            console.log(`✅ Display updated for view: ${this.currentView}`);
        } catch (error) {
            console.error(`❌ Error updating display:`, error);
        }
    }

    updatePersonalFinanceDisplay() {
        this.updateBalanceCards();
        this.updateTransactionsList();
    }

    updateBalanceCards() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const currentBalance = totalIncome - totalExpenses;
        
        this.updateElementText('current-balance', this.formatCurrency(currentBalance));
        this.updateElementText('total-income', this.formatCurrency(totalIncome));
        this.updateElementText('total-expenses', this.formatCurrency(totalExpenses));
    }

    updateBusinessDisplay() {
        // Business display logic here
    }

    updateTransactionsList() {
        // Transactions list update logic here
    }

    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    formatCurrency(amount) {
        return `₹${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }

    // STORAGE METHODS
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    loadFromStorage(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return defaultValue;
        }
    }

    // PLACEHOLDER METHODS FOR MISSING FUNCTIONALITY
    handleBusinessTransactionSubmit(e) { /* Business transaction logic */ }
    cancelTransactionEdit() { /* Cancel edit logic */ }
    cancelBusinessTransactionEdit() { /* Cancel business edit logic */ }
    showAddCustomerModal() { /* Show customer modal */ }
    hideAddCustomerModal() { /* Hide customer modal */ }
    handleAddCustomer() { /* Add customer logic */ }
    searchCustomers(query) { /* Search customers */ }
    showAllCustomers() { /* Show all customers */ }
    showOutstandingBalances() { /* Show outstanding balances */ }
    hideDeleteModal() { /* Hide delete modal */ }
    confirmDelete() { /* Confirm delete */ }
    applyFilters() { /* Apply filters */ }
    clearFilters() { /* Clear filters */ }
    initializeChart() { /* Initialize chart */ }
}

// Auto-initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting AI-Enhanced Financial Management System...');
    window.financeApp = new FinanceApp();
});

// Add some CSS for AI indicators
const aiStyles = `
<style>
.ai-confidence-indicator {
    margin-top: 5px;
    font-size: 12px;
}

.ai-suggestion {
    padding: 8px 12px;
    border-radius: 6px;
    border-left: 4px solid #667eea;
    background: #f0f4ff;
    color: #4c63d2;
}

.ai-suggestion.high {
    border-left-color: #10b981;
    background: #f0fdf4;
    color: #065f46;
}

.ai-suggestion.medium {
    border-left-color: #f59e0b;
    background: #fffbeb;
    color: #92400e;
}

.ai-suggestion.low {
    border-left-color: #ef4444;
    background: #fef2f2;
    color: #991b1b;
}

.confidence {
    font-weight: normal;
    opacity: 0.7;
}

.ai-loading {
    padding: 8px 12px;
    border-radius: 6px;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 12px;
}

.loading-dots::after {
    content: '';
    animation: loading-dots 1.5s infinite;
}

@keyframes loading-dots {
    0%, 20% { content: ''; }
    40% { content: '.'; }
    60% { content: '..'; }
    90%, 100% { content: '...'; }
}

.loading-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

.notification.success {
    background: #10b981;
    color: white;
}

.notification.error {
    background: #ef4444;
    color: white;
}

.notification.info {
    background: #3b82f6;
    color: white;
}

.notification-close {
    float: right;
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.field-error {
    color: #ef4444;
    font-size: 12px;
    margin-top: 4px;
}

.invalid {
    border-color: #ef4444 !important;
}
</style>
`;

// Inject AI styles
document.head.insertAdjacentHTML('beforeend', aiStyles);