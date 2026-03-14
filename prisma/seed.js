const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultAppConfig = {
  featureFlags: [
    { key: 'live_scores', label: 'Live scores', description: 'Show live scores to members', enabled: true },
    { key: 'streaks', label: 'Streaks', description: 'Enable streak tracking', enabled: true },
    { key: 'favorites', label: 'Favorites', description: 'Allow favorites (teams/players)', enabled: true },
    { key: 'leaderboard', label: 'Leaderboard', description: 'Show streak leaderboard', enabled: true },
    { key: 'news', label: 'News', description: 'Show news & updates', enabled: true },
  ],
  saAdmins: [],
  permissions: [
    { key: 'admin_manage_users', label: 'Manage users (view, ban, suspend)', enabled: true },
    { key: 'admin_view_leaderboard', label: 'View streak leaderboard', enabled: true },
    { key: 'admin_engagement', label: 'View engagement analytics', enabled: true },
    { key: 'admin_reset_streak', label: 'Reset user streak', enabled: true },
  ],
  maintenance: false,
  health: { server: 'OK', db: 'Connected', api: 'OK', uptime: '99.9%' },
  auditLog: [],
  enabledSports: {},
  superAdminEmails: {},
};

async function main() {
  await prisma.appConfig.upsert({
    where: { id: 'app' },
    create: {
      id: 'app',
      ...defaultAppConfig,
    },
    update: defaultAppConfig,
  });
  console.log('Seeded app_config (id: app)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
