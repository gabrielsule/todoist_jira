const config = require('./config/config.json');
const axios = require('axios').default;
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const notifier = require('node-notifier');

getTask();

async function getTask() {
    const header = {
        headers: {
            'Content-Type': 'application/json',
        },
        auth: {
            username: `${config.jira.user}`,
            password: `${config.jira.token}`
        },
    }

    await axios.get(`${config.jira.url}${config.jira.query}`, header)
        .then(response => {
            let key = response.data.issues[0].key;
            let due = moment(response.data.issues[0].fields.created).format('YYYY/MM/DD').toString();
            let summary = response.data.issues[0].fields.summary;
            let displayName = response.data.issues[0].fields.creator.displayName;
            let content = key + ' ' + displayName + ' ' + summary;

            addTask(content, due)
        })
        .catch(error => {
            console.log('ERROR', error.response);
        });
}


async function addTask(content, due) {

    const header = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.todo.token}`
        }
    }

    const body = {
        'content': content,
        'due_string': due,
        'due_lang': 'es',
        'priority': 3,
        'project_id': 2213181326
    }

    await axios.post(`${config.todo.url}tasks`, body, header)
        .then(response => {
            notify(content);
            saveDate();
        })
        .catch(error => {
            console.log(error);
            notify('no se pudo cargar la tarea');
        });
}


function notify(msg) {
    notifier.notify({
        title: 'Tareas pendientes',
        message: msg,
        icon: path.join(__dirname, 'assets', 'fire.png')
    });
}


function readDate() {
    let data = JSON.parse(fs.readFileSync('lastrun.json', 'utf-8'));
    return data.date
}


function saveDate() {
    let body = {
        "date": moment().format('DD/MM/YYYY hh:mm:ss')
    }

    fs.writeFile('lastrun.json', JSON.stringify(body), (err) => {
        if (err) throw err;
    });
}