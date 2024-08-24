// database.js

function loadFiles() {
    fetch('/files')
        .then(response => response.json())
        .then(files => {
            const tableBody = $("#filesTable tbody");
            tableBody.empty();
            files.forEach(file => {
                const row = $("<tr>");
                row.append($("<td>").text(file.id));
                row.append($("<td>").text(file.name));
                row.append($("<td>").text(file.type));
                const actions = $("<td>");
                const deleteButton = $("<button>").text("Delete").click(function() {
                    fetch('/files/' + file.id, { method: 'DELETE' })
                        .then(response => {
                            if (response.ok) {
                                row.remove();
                            } else {
                                alert('Failed to delete file');
                            }
                        });
                });
                actions.append(deleteButton);
                row.append(actions);
                tableBody.append(row);
            });
        });
}

function setupFileForm() {
    $("#addFileForm").on("submit", function(event) {
        event.preventDefault();
        const name = $("#fileName").val();
        const type = $("#fileType").val();

        fetch('/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name, type: type })
        })
        .then(response => response.json())
        .then(file => {
            loadFiles();
            $("#fileName").val('');
            $("#fileType").val('');
        });
    });
}

function loadStudents() {
    fetch('/studentInfo')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(students => {
            const tableBody = $("#addstudent tbody");
            tableBody.empty();
            students.forEach(student => {
                const row = $("<tr>");
                row.append($("<td>").text(student.user_id));
                row.append($("<td>").text(student.fname));
                row.append($("<td>").text(student.lname));
                row.append($("<td>").text(student.password));
                const actions = $("<td>");
                const deleteButton = $("<button>").text("Delete").click(function() {
                    fetch('/studentInfo/' + student.user_id, { method: 'DELETE' })
                        .then(response => {
                            if (response.ok) {
                                row.remove();
                            } else {
                                alert('Failed to delete student');
                            }
                        });
                });
                actions.append(deleteButton);
                row.append(actions);
                tableBody.append(row);
            });
        })
        .catch(error => {
            console.error('There was a problem fetching student info:', error);
        });
}

function setupStudentForm() {
    $("#addstudentform").on("submit", function(event) {
        event.preventDefault();
        const fname = $("#fname").val();
        const lname = $("#lname").val();
        const password = $("#password").val();
        fetch('/studentInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fname: fname, lname: lname, password: password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(() => {
            loadStudents();
            $("#fname").val('');
            $("#lname").val('');
            $("#password").val('');
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
    });
}

// Document ready function to initialize everything
$(document).ready(function() {
    loadFiles();
    setupFileForm();
    loadStudents();
    setupStudentForm();
});
