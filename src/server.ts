import 'reflect-metadata';
import http from 'http';
import app from './app';
import { config } from '#common/helpers';
import { DatabaseDriverFactory } from '#infrastructure/database/driver.factory';
import { Logger } from '#infrastructure/observability/logger';
import { container, registerObservers } from '#app/container';
import { NotificationGateway } from '#infrastructure/websocket/notification.gateway';

async function bootstrap() {
  try {
    Logger.info(
      `Bootstrapping system environment: [${config('app.node_env')}]...`
    );

    registerObservers();

    const httpServer = http.createServer(app);
    const gateway = new NotificationGateway(httpServer);

    const notifWebSocketChannel = container.resolve<
      import('#infrastructure/notifier/channels/websocket.channel').WebSocketChannel
    >('notifWebSocketChannel');
    notifWebSocketChannel.setGateway(gateway);

    const notificationService = container.resolve<
      import('#features/notification/notification.service').NotificationService
    >('notificationService');

    const communityService =
      container.resolve<
        import('#features/community/community.service').CommunityService
      >('communityService');
    communityService.setNotificationService(notificationService);

    const port: number = config('app.port');

    httpServer.listen(port, () => {
      Logger.info(
        `${config('app.name')} listening smoothly on http://localhost:${port}`
      );
    });
  } catch (error) {
    Logger.error(
      `Failed to bootstrap the application: ${(error as Error).message}`
    );
    await DatabaseDriverFactory.disconnect();
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  Logger.info('SIGTERM received, shutting down gracefully...');
  await DatabaseDriverFactory.disconnect();
  process.exit(0);
});

bootstrap();
