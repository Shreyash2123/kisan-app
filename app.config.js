export default ({ config }) => ({
    ...config,
    extra: {
      ...config.extra,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    },
  });