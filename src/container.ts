import { createContainer, asClass, asFunction, InjectionMode } from 'awilix';

import { PrismaDriver } from '#infrastructure/database/drivers';
import { StorageService } from '#infrastructure/storage/storage.service';
import { MailService } from '#infrastructure/mail/mail.service';
import { QueueService } from '#infrastructure/queue/queue.service';
import { CacheService } from '#infrastructure/cache/cache.service';
import { QueueFactory } from '#infrastructure/queue/queue.factory';
import { MlClient } from '#infrastructure/plant-analyzer-client';
import { config } from '#common/helpers';

import { AuthController } from '#features/auth/auth.controller';
import { AuthService } from '#features/auth/auth.service';
import { AuthRepository } from '#features/auth/auth.repository';
import { AuthPolicy } from '#features/auth/auth.policy';
import { OtpService } from '#features/auth/otp.service';
import { OtpRepository } from '#features/auth/otp.repository';
import { RefreshTokenRepository } from '#features/auth/refreshToken.repository';
import { EmailChannel as OtpEmailChannel } from '#infrastructure/channel';
import {
  WebSocketChannel,
  EmailChannel as NotifEmailChannel,
  PushChannel,
  Notifier,
} from '#infrastructure/notifier';

import { ProfileController } from '#features/profile/profile.controller';
import { ProfileService } from '#features/profile/profile.service';
import { UserController } from '#features/user/user.controller';
import { UserService } from '#features/user/user.service';
import { UserRepository } from '#features/user/user.repository';
import { UserPolicy } from '#features/user/user.policy';
import { NotificationPreferencesRepository } from '#features/user/notificationPreferences.repository';

import { ArticleController } from '#features/article/article.controller';
import { ArticleService } from '#features/article/article.service';
import { ArticleRepository } from '#features/article/article.repository';
import { ArticlePolicy } from '#features/article/article.policy';

import { PlantController } from '#features/plant/plant.controller';
import { PlantService } from '#features/plant/plant.service';
import { PlantRepository } from '#features/plant/plant.repository';
import { PlantPolicy } from '#features/plant/plant.policy';

import { MyPlantController } from '#features/myPlant/myPlant.controller';
import { MyPlantService } from '#features/myPlant/myPlant.service';
import { MyPlantRepository } from '#features/myPlant/myPlant.repository';
import { CareLogRepository } from '#features/myPlant/careLog.repository';
import { MyPlantPolicy } from '#features/myPlant/myPlant.policy';

import { DiagnosticController } from '#features/diagnostic/diagnostic.controller';
import { DiagnosticService } from '#features/diagnostic/diagnostic.service';
import { DiagnosticRepository } from '#features/diagnostic/diagnostic.repository';
import { DiagnosticPolicy } from '#features/diagnostic/diagnostic.policy';

import { DiseaseController } from '#features/disease/disease.controller';
import { DiseaseService } from '#features/disease/disease.service';
import { DiseaseRepository } from '#features/disease/disease.repository';
import { DiseasePolicy } from '#features/disease/disease.policy';

import { NotificationController } from '#features/notification/notification.controller';
import { NotificationService } from '#features/notification/notification.service';
import { NotificationRepository } from '#features/notification/notification.repository';
import { NotificationPolicy } from '#features/notification/notification.policy';
import type { INotificationRepository } from '#features/notification/notification.repository.interface';
import type { INotificationPreferencesRepository } from '#features/user/notificationPreferences.repository.interface';

import { UserObserver } from '#features/user/observers/user.observer';
import { AuthObserver } from '#features/auth/observers/auth.observer';

import { CommunityController } from '#features/community/community.controller';
import { CommunityService } from '#features/community/community.service';
import { CommunityRepository } from '#features/community/community.repository';
import { PostPolicy } from '#features/community/community.policy';
import { CommentRepository } from '#features/community/comment.repository';
import { LikeRepository } from '#features/community/like.repository';

import { UploadController } from '#features/upload/upload.controller';
import { UploadService } from '#features/upload/upload.service';

type Container = Record<string, unknown>;

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
});

container.register({
  databaseDriver: asClass(PrismaDriver).singleton(),
  storageService: asClass(StorageService).singleton(),
  mailService: asClass(MailService).singleton(),
  queueDriver: asFunction(() => QueueFactory.queue()).singleton(),
  queueService: asClass(QueueService).singleton(),
  cacheService: asClass(CacheService).singleton(),
  mlClient: asFunction(() => {
    return new MlClient({
      baseUrl: config<string>('app.analyzer_url', 'http://localhost:5000/v1'),
    });
  }).singleton(),

  authController: asClass(AuthController).singleton(),
  authService: asClass(AuthService).singleton(),
  authRepository: asClass(AuthRepository).singleton(),
  authPolicy: asClass(AuthPolicy).singleton(),
  otpService: asClass(OtpService).singleton(),
  otpRepository: asClass(OtpRepository).singleton(),
  otpEmailChannel: asClass(OtpEmailChannel).singleton(),
  refreshTokenRepository: asClass(RefreshTokenRepository).singleton(),

  channels: asFunction((c: Container) => ({
    email: c.otpEmailChannel,
  })).singleton(),

  userController: asClass(UserController).singleton(),
  userService: asClass(UserService).singleton(),
  userRepository: asClass(UserRepository).singleton(),
  notificationPreferencesRepository: asClass(
    NotificationPreferencesRepository
  ).singleton(),
  userPolicy: asClass(UserPolicy).singleton(),
  profileController: asClass(ProfileController).singleton(),
  profileService: asClass(ProfileService).singleton(),

  plantController: asClass(PlantController).singleton(),
  plantService: asClass(PlantService).singleton(),
  plantRepository: asClass(PlantRepository).singleton(),
  plantPolicy: asClass(PlantPolicy).singleton(),

  communityController: asClass(CommunityController).singleton(),
  communityService: asClass(CommunityService).singleton(),
  communityRepository: asClass(CommunityRepository).singleton(),
  postPolicy: asClass(PostPolicy).singleton(),
  commentRepository: asClass(CommentRepository).singleton(),
  likeRepository: asClass(LikeRepository).singleton(),

  uploadService: asClass(UploadService).singleton(),
  uploadController: asClass(UploadController).singleton(),

  articleController: asClass(ArticleController).singleton(),
  articleService: asClass(ArticleService).singleton(),
  articleRepository: asClass(ArticleRepository).singleton(),
  articlePolicy: asClass(ArticlePolicy).singleton(),

  myPlantController: asClass(MyPlantController).singleton(),
  myPlantService: asClass(MyPlantService).singleton(),
  myPlantRepository: asClass(MyPlantRepository).singleton(),
  careLogRepository: asClass(CareLogRepository).singleton(),
  myPlantPolicy: asClass(MyPlantPolicy).singleton(),

  diagnosticController: asClass(DiagnosticController).singleton(),
  diagnosticService: asClass(DiagnosticService).singleton(),
  diagnosticRepository: asClass(DiagnosticRepository).singleton(),
  diagnosticPolicy: asClass(DiagnosticPolicy).singleton(),

  diseaseController: asClass(DiseaseController).singleton(),
  diseaseService: asClass(DiseaseService).singleton(),
  diseaseRepository: asClass(DiseaseRepository).singleton(),
  diseasePolicy: asClass(DiseasePolicy).singleton(),

  notificationController: asClass(NotificationController).singleton(),
  notificationService: asClass(NotificationService).singleton(),
  notificationRepository: asClass(NotificationRepository).singleton(),
  notifWebSocketChannel: asClass(WebSocketChannel).singleton(),
  notifEmailChannel: asClass(NotifEmailChannel).singleton(),
  notifPushChannel: asClass(PushChannel).singleton(),
  notifier: asFunction(
    (c: Container) =>
      new Notifier(
        [
          c.notifWebSocketChannel as WebSocketChannel,
          c.notifEmailChannel as NotifEmailChannel,
          c.notifPushChannel as PushChannel,
        ],
        {
          notificationRepository:
            c.notificationRepository as INotificationRepository,
          notificationPreferencesRepository:
            c.notificationPreferencesRepository as INotificationPreferencesRepository,
        }
      )
  ).singleton(),
  notificationPolicy: asClass(NotificationPolicy).singleton(),

  services: asFunction((c: Container) => ({
    databaseDriver: c.databaseDriver,
    mailService: c.mailService,
    queueService: c.queueService,
    storageService: c.storageService,
    cacheService: c.cacheService,
    authService: c.authService,
    userService: c.userService,
    profileService: c.profileService,
    plantService: c.plantService,
    communityService: c.communityService,
    articleService: c.articleService,
    myPlantService: c.myPlantService,
    diagnosticService: c.diagnosticService,
    diseaseService: c.diseaseService,
    notificationService: c.notificationService,
  })).singleton(),

  policies: asFunction((c: Container) => ({
    authPolicy: c.authPolicy,
    userPolicy: c.userPolicy,
    plantPolicy: c.plantPolicy,
    postPolicy: c.postPolicy,
    articlePolicy: c.articlePolicy,
    myPlantPolicy: c.myPlantPolicy,
    diagnosticPolicy: c.diagnosticPolicy,
    diseasePolicy: c.diseasePolicy,
    notificationPolicy: c.notificationPolicy,
  })).singleton(),

  repositories: asFunction((c: Container) => ({
    authRepository: c.authRepository,
    userRepository: c.userRepository,
    notificationPreferencesRepository: c.notificationPreferencesRepository,
    plantRepository: c.plantRepository,
    communityRepository: c.communityRepository,
    commentRepository: c.commentRepository,
    likeRepository: c.likeRepository,
    articleRepository: c.articleRepository,
    myPlantRepository: c.myPlantRepository,
    careLogRepository: c.careLogRepository,
    diagnosticRepository: c.diagnosticRepository,
    diseaseRepository: c.diseaseRepository,
    otpRepository: c.otpRepository,
    notificationRepository: c.notificationRepository,
  })).singleton(),
});

export function registerObservers(): void {
  const userRepo =
    container.resolve<import('#features/user/user.repository').UserRepository>(
      'userRepository'
    );
  const mailService =
    container.resolve<import('#infrastructure/mail/mail.service').MailService>(
      'mailService'
    );
  userRepo.registerObserver(new UserObserver(mailService));

  const authService =
    container.resolve<import('#features/auth/auth.service').AuthService>(
      'authService'
    );
  const cacheService =
    container.resolve<
      import('#infrastructure/cache/cache.service').CacheService
    >('cacheService');
  authService.registerObserver(new AuthObserver(mailService, cacheService));
}

export { container };
