module.exports = {
  apps: [
    {
      name: "wms-despacho",
      cwd: "/var/www/wms-despacho",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:/var/www/wms-despacho/prisma/dev.db",
        JWT_SECRET: "3537814760e04674141ac1dfa3bf752d2388c34cb6d7df4dfb8b90972b8e19ce"
      }
    }
  ]
};
