
$(document).ready(function () {

    startInitialization();

    $('#cep').blur(function () {
        const cep = { cepInput: $(this), cepFormated: $(this).val().replace(/\D/g, '') }

        if (!cepIsValid(cep)) return;

        $.ajax({
            url: `https://viacep.com.br/ws/${cep.cepFormated}/json/`,
            dataType: 'json',
            success: function (data) {
                if (data.erro) {
                    cep.cepInput.addClass('is-invalid');
                    $('#endereco').val('');
                    return;
                }
                $('#endereco').val(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
            },
            error: function () {
                cep.cepInput.addClass('is-invalid');
            }
        });
    });


    $('#cep').on('input', function () {
        if ($(this).val().replace(/\D/g, '').length >= 8) {
            $(this).removeClass('is-invalid');
        }
    });

    $('#formCadastro').on('submit', function (event) {
        event.preventDefault();

        const form = this;

        registerCustomer(form);

    });

});


//algumas coisas precisam ser inicializadas, como o inicio do dataTable, carregar os clientes para a tabela e a validacao para deixar pronto no formulario

function startInitialization() {
    initTable();
    loadCustomers();
    bootstrapValidation();
}

function loadCustomers() {
    const dados = getCustomers() || [];

    const table = $('#tabelaCadastrados').DataTable();
    table.clear();

    dados.forEach(item => {
        table.row.add([
            item.nome,
            item.email,
            item.cep,
            `${item.endereco}, ${item.numero} ${item.complemento}`,
            `<button class="btn btn-sm btn-danger btn-delete" data-id="${item.id}" >
                Excluir
            </button>`
        ]);
    });

    table.draw();

    actionDelete();

}

//acao que eu coloco no botao de deletar cliente
function actionDelete() {
    $('#tabelaCadastrados').off('click', '.btn-delete').on('click', '.btn-delete', function () {
        const id = $(this).data('id');

        const dados = getCustomers() || [];

        const novoArray = dados.filter(item => item.id !== id);

        updateCustomers(novoArray);
        loadCustomers();
        showToast('toastExclusao');
    });
}


function registerCustomer(form) {


    const customer = {
        id: crypto.randomUUID(),
        nome: $('#nome').val().trim(),
        email: $('#email').val().trim(),
        cep: $('#cep').val().replace(/\D/g, '').trim(),
        endereco: $('#endereco').val().trim(),
        numero: $('#numero').val().trim(),
        complemento: $('#complemento').val().trim()
    };


    if (!cepIsValidLength(customer.cep)) return;



    const currentCustomers = getCustomers() || [];

    if (customerExists(customer.email, currentCustomers)) {
        showToast('toastErro')
        return;
    }

    currentCustomers.push(customer);


    updateCustomers(currentCustomers);

    form.reset();

    $(form).removeClass('was-validated');

    loadCustomers();
    showToast('toastSucesso');
}



function customerExists(email, currentCustomers) {

    return currentCustomers.some(c =>
        c.email.toLowerCase() === email.toLowerCase()
    );
}

//em caso de sucessos mostro um toast na tela em cima, criei essa funcao para evitar repeticao e facilitar
function showToast(toastId) {
    const toast = new bootstrap.Toast(document.getElementById(toastId));
    toast.show();
}

function cepIsValid(cep) {

    if (cepIsValidLength(cep.cepFormated)) {
        cep.cepInput.removeClass('is-invalid');
        return true;
    } else {
        cep.cepInput.addClass('is-invalid');
        $('#endereco').val('');
        return false;;
    }
}

function cepIsValidLength(cep) {

    return cep.length == 8;
}


function bootstrapValidation() {
    //Eu usei aqui a validação indicada pelas próprias classes bootstrap, preferi esse ao invés do jquery validate.js
    (() => {
        'use strict';
        const forms = document.querySelectorAll('.needs-validation');
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    //feito isso pois só vou mostrar quando digitar menos de 8 digitos
                    $('#cep-error-length').hide();
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    })();
}


//como eu uso um sidebar, criei uma funcao para mostrar a secao de listar clientes ou cadastrar

function showSection(secao) {
    document.getElementById('secao-cadastro').classList.add('hidden');
    document.getElementById('secao-listar').classList.add('hidden');
    document.getElementById(`secao-${secao}`).classList.remove('hidden');
}


function initTable() {
    $('#tabelaCadastrados').DataTable({
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json"
        },
        pageLength: 5
    });
}


const getCustomers = () => JSON.parse(localStorage.getItem('customers'));

const updateCustomers = (customers) => localStorage.setItem('customers', JSON.stringify(customers));