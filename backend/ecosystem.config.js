module.exports = {
    apps: [{
        name: "Trackbox-backend",
        script: "./app.js",
        instances: 1,
        exec_mode: "cluster",
        max_memory_restart: "1G",
        watch: false,
        env: {
            NODE_ENV: "development",
            PORT: 3520,
            DB_POOL_MIN: "2",
            DB_POOL_MAX: "10",
            DB_TIMEOUT: "30000"
        },
        error_file: "logs/pm2/err.log",
        out_file: "logs/pm2/out.log",
        log_date_format: "YYYY-MM-DD HH:mm:ss",
        merge_logs: true
    }]
};