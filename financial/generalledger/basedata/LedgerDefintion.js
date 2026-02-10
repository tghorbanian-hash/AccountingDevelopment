import { 
    createPageHeader, 
    createButton, 
    createTable, 
    createModal, 
    createInput, 
    createSelect, 
    showToast 
} from '../../../../UIComponents.js';
import { appData } from '../../../../app-data.js';

export function render(container) {
    container.innerHTML = '';
    const lang = appData.appSettings.language;
    const t = appData.translations;

    // Header
    const header = createPageHeader(t.ledgerDefinition[lang]);
    container.appendChild(header);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100';

    const searchInput = createInput({
        placeholder: t.search[lang],
        onChange: (e) => filterLedgers(e.target.value)
    });
    searchInput.className += ' w-64';

    const addButton = createButton({
        text: t.addLedger[lang],
        icon: 'plus',
        variant: 'primary',
        onClick: () => openLedgerModal()
    });

    toolbar.appendChild(searchInput);
    toolbar.appendChild(addButton);
    container.appendChild(toolbar);

    // Grid Container
    const gridContainer = document.createElement('div');
    gridContainer.id = 'ledger-grid-container';
    container.appendChild(gridContainer);

    renderGrid(gridContainer);

    // Functions
    function renderGrid(targetContainer) {
        targetContainer.innerHTML = '';
        
        const columns = [
            { field: 'code', header: t.ledgerCode[lang], width: '15%' },
            { field: lang === 'fa' ? 'title' : 'titleEn', header: t.ledgerTitle[lang], width: '25%' },
            { 
                field: 'isMain', 
                header: t.isMain[lang], 
                width: '10%',
                render: (row) => `<span class="px-2 py-1 rounded text-xs ${row.isMain ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}">${row.isMain ? t.yes[lang] : t.no[lang]}</span>`
            },
            { 
                field: 'status', 
                header: t.status[lang], 
                width: '10%',
                render: (row) => `<span class="px-2 py-1 rounded text-xs ${row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${row.status === 'active' ? t.active[lang] : t.inactive[lang]}</span>`
            },
            {
                field: 'actions',
                header: t.actions[lang],
                width: '20%',
                render: (row) => {
                    return `
                        <button class="edit-btn text-indigo-600 hover:text-indigo-900 mx-1" data-id="${row.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn text-red-600 hover:text-red-900 mx-1" data-id="${row.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ];

        const grid = createTable({
            columns: columns,
            data: appData.ledgers,
            onRowClick: () => {} 
        });

        targetContainer.appendChild(grid);

        // Attach Event Listeners
        targetContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                const ledger = appData.ledgers.find(l => l.id === id);
                if (ledger) openLedgerModal(ledger);
            });
        });

        targetContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.getAttribute('data-id'));
                deleteLedger(id);
            });
        });
    }

    function filterLedgers(query) {
        if (!query) {
            renderGrid(gridContainer);
            return;
        }
        const lowerQuery = query.toLowerCase();
        const filtered = appData.ledgers.filter(l => 
            l.code.toLowerCase().includes(lowerQuery) || 
            l.title.toLowerCase().includes(lowerQuery) ||
            (l.titleEn && l.titleEn.toLowerCase().includes(lowerQuery))
        );
        
        // Temporarily override data for rendering
        const tempGrid = createTable({
            columns: [
                { field: 'code', header: t.ledgerCode[lang], width: '15%' },
                { field: lang === 'fa' ? 'title' : 'titleEn', header: t.ledgerTitle[lang], width: '25%' },
                { field: 'isMain', header: t.isMain[lang], width: '10%', render: (row) => row.isMain ? t.yes[lang] : t.no[lang] },
                { field: 'status', header: t.status[lang], width: '10%', render: (row) => row.status === 'active' ? t.active[lang] : t.inactive[lang] },
                { field: 'actions', header: t.actions[lang], width: '20%', render: () => '' } // Simplified for search
            ],
            data: filtered
        });
        
        gridContainer.innerHTML = '';
        gridContainer.appendChild(tempGrid);
    }

    function openLedgerModal(ledger = null) {
        const isEdit = !!ledger;
        
        // Prepare options
        const statusOptions = [
            { value: 'active', label: t.active[lang] },
            { value: 'inactive', label: t.inactive[lang] }
        ];
        
        const booleanOptions = [
            { value: 'true', label: t.yes[lang] },
            { value: 'false', label: t.no[lang] }
        ];

        const structureOptions = appData.accountStructures.map(s => ({
            value: s.id,
            label: lang === 'fa' ? s.title : s.titleEn
        }));

        const currencyOptions = appData.currencies.map(c => ({
            value: c.id,
            label: `${c.code} - ${c.title}`
        }));

        const content = document.createElement('div');
        content.className = 'space-y-4';

        // Code
        const codeInput = createInput({
            label: t.ledgerCode[lang],
            value: ledger ? ledger.code : '',
            required: true
        });

        // Title (FA)
        const titleInput = createInput({
            label: t.ledgerTitle[lang] + ' (FA)',
            value: ledger ? ledger.title : '',
            required: true
        });

        // Title (EN)
        const titleEnInput = createInput({
            label: t.ledgerTitle[lang] + ' (EN)',
            value: ledger ? ledger.titleEn : ''
        });

        // Status
        const statusSelect = createSelect({
            label: t.status[lang],
            options: statusOptions,
            value: ledger ? ledger.status : 'active'
        });

        // Is Main
        const isMainSelect = createSelect({
            label: t.isMain[lang],
            options: booleanOptions,
            value: ledger ? (ledger.isMain ? 'true' : 'false') : 'false'
        });

        // Structure
        const structureSelect = createSelect({
            label: t.accountStructure[lang],
            options: structureOptions,
            value: ledger ? ledger.accountStructureId : (structureOptions.length > 0 ? structureOptions[0].value : '')
        });

        // Currency
        const currencySelect = createSelect({
            label: t.mainCurrency[lang],
            options: currencyOptions,
            value: ledger ? ledger.currencyId : (currencyOptions.length > 0 ? currencyOptions[0].value : '')
        });

        content.append(codeInput, titleInput, titleEnInput, statusSelect, isMainSelect, structureSelect, currencySelect);

        const modal = createModal({
            title: isEdit ? t.edit[lang] : t.addLedger[lang],
            content: content,
            footer: [
                createButton({
                    text: t.cancel[lang],
                    variant: 'secondary',
                    onClick: () => modal.close()
                }),
                createButton({
                    text: t.save[lang],
                    variant: 'primary',
                    onClick: () => {
                        const newLedger = {
                            id: ledger ? ledger.id : Date.now(),
                            code: codeInput.querySelector('input').value,
                            title: titleInput.querySelector('input').value,
                            titleEn: titleEnInput.querySelector('input').value,
                            status: statusSelect.querySelector('select').value,
                            isMain: isMainSelect.querySelector('select').value === 'true',
                            accountStructureId: parseInt(structureSelect.querySelector('select').value),
                            currencyId: parseInt(currencySelect.querySelector('select').value)
                        };

                        if (!newLedger.code || !newLedger.title) {
                            showToast('لطفا فیلدهای اجباری را تکمیل کنید', 'error');
                            return;
                        }

                        if (isEdit) {
                            const index = appData.ledgers.findIndex(l => l.id === ledger.id);
                            appData.ledgers[index] = newLedger;
                            showToast(t.successUpdate[lang], 'success');
                        } else {
                            appData.ledgers.push(newLedger);
                            showToast(t.successAdd[lang], 'success');
                        }

                        modal.close();
                        renderGrid(gridContainer);
                    }
                })
            ]
        });
    }

    function deleteLedger(id) {
        if (confirm(t.confirmDelete[lang])) {
            appData.ledgers = appData.ledgers.filter(l => l.id !== id);
            showToast(t.successDelete[lang], 'success');
            renderGrid(gridContainer);
        }
    }
}
