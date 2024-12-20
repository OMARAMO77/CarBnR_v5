$(document).ready(function () {
    const dropZone = $('#drop-zone');
    const fileInput = $('#file-input');
    const progressBar = $('#progress-bar');
    const progressContainer = $('.progress');
    const fileList = $('#file-list');
    const clearFilesBtn = $('#clear-files');
    const uploadBtn = $('#upload-btn');
    let files = [];

    dropZone.on('click', function () {
        // Ensure we are triggering the file input only once to avoid recursion
        if (!fileInput[0].clicking) {
            fileInput[0].clicking = true; // Set a flag to prevent recursion
            fileInput.click();
            setTimeout(() => { fileInput[0].clicking = false; }, 100); // Reset after the event is triggered
        }
    });

    fileInput.on('change', handleFiles);

    dropZone.on('dragover', function (e) {
        e.preventDefault();
        dropZone.addClass('dragover');
    });

    dropZone.on('dragleave', function () {
        dropZone.removeClass('dragover');
    });

    dropZone.on('drop', function (e) {
        e.preventDefault();
        dropZone.removeClass('dragover');
        const droppedFiles = e.originalEvent.dataTransfer.files;
        handleFiles({ target: { files: droppedFiles } });
    });

    function handleFiles(e) {
        const newFiles = e.target.files;
        for (const file of newFiles) {
            files.push(file);
            addFileToList(file);
        }
        updateFormState();
    }

    function addFileToList(file) {
        const listItem = $('<li></li>')
            .addClass('list-group-item d-flex justify-content-between align-items-center')
            .text(file.name);

        const sizeBadge = $('<span></span>')
            .addClass('badge bg-primary rounded-pill')
            .text(`${(file.size / 1024).toFixed(2)} KB`);

        const removeBtn = $('<span>&times;</span>')
            .addClass('remove-file')
            .click(function () {
                const index = files.indexOf(file);
                if (index > -1) {
                    files.splice(index, 1);
                    listItem.remove();
                    updateFormState();
                }
            });

        listItem.append(sizeBadge).append(removeBtn);
        fileList.append(listItem);
    }

    function updateFormState() {
        if (files.length > 0) {
            uploadBtn.show();
        } else {
            uploadBtn.hide();
        }
    }

    clearFilesBtn.on('click', function () {
        files = [];
        fileList.empty();
        updateFormState();
    });

    uploadBtn.on('click', function () {
        const formData = new FormData();
        files.forEach(file => formData.append('files[]', file));

        progressContainer.show();
        progressBar.css('width', '0%').text('0%');

        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            xhr: function () {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function (e) {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        progressBar.css('width', percentComplete + '%').text(Math.floor(percentComplete) + '%');
                    }
                });
                return xhr;
            },
            success: function (response) {
                progressBar.removeClass('bg-danger').addClass('bg-success').text('Upload Complete!');
                alert(response.success);
            },
            error: function (xhr, status, error) {
                progressBar.removeClass('bg-success').addClass('bg-danger').text('Upload Failed!');
                alert('Error: ' + xhr.responseText || error);
            }
        });
    });
});
