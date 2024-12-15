// public/js/alert-handler.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up alert handlers');
    document.querySelectorAll('.alert-dismissible .btn-close').forEach(button => {
        console.log('Found button:', button.dataset.settingKey);
        button.addEventListener('click', async (e) => {
            console.log('Button clicked');
            const key = e.target.dataset.settingKey;
            console.log('Key:', key);
            try {
                const response = await fetch(`/settings/dismiss?key=${key}`);
                const data = await response.json();
                console.log('Response:', data);
                if (data.success) {
                    e.target.closest('.alert').remove();
                }
            } catch (error) {
                console.error('Failed to dismiss alert:', error);
            }
        });
    });
});