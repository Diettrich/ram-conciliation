const Connection = require("tedious").Connection;
const Request = require("tedious").Request;

const config = {
    server: "ram-db.database.windows.net",
    authentication: {
        type: "default",
        options: {
            userName: "ram",
            password: "avBy2kvJTbwQt5t",
        },
    },
    options: {
        encrypt: true,
        database: "ram-db",
        port: 1433,
    },
};

const connection = new Connection(config);

connection.on("connect", function (err) {
    if (err) {
        console.log("debug");
        console.log(err);
    } else {
        console.log("connected");
        executeStatement();
    }
});

connection.connect();

function executeStatement() {
    let request = new Request("select 123, 'hello world'", (err, rowCount) => {
        // callback function
        if (err) {
            console.log(err);
        } else {
            console.log(`${rowCount} rows`);
        }
        connection.close();
    });

    request.on("row", (columns) => {
        columns.forEach((column) => {
            if (column.value === null) {
                console.log("NULL");
            } else {
                console.log(column.value);
            }
        });
    });

    connection.execSql(request);
}
