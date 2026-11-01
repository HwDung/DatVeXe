BEGIN TRY
BEGIN TRAN;

-- Bootstrap referenced role records before adding the FK to existing memberships.
IF NOT EXISTS (SELECT 1 FROM [dbo].[Role] WHERE [name] = N'admin')
 INSERT INTO [dbo].[Role] ([id],[name],[description]) VALUES (N'role_admin',N'admin',N'Quản trị viên');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Role] WHERE [name] = N'USER')
 INSERT INTO [dbo].[Role] ([id],[name],[description]) VALUES (N'role_customer',N'USER',N'Khách hàng');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Role] WHERE [name] = N'owner')
 INSERT INTO [dbo].[Role] ([id],[name],[description]) VALUES (N'role_owner',N'owner',N'Chủ nhà xe');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Role] WHERE [name] = N'manager')
 INSERT INTO [dbo].[Role] ([id],[name],[description]) VALUES (N'role_manager',N'manager',N'Quản lý nhà xe');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Role] WHERE [name] = N'staff')
 INSERT INTO [dbo].[Role] ([id],[name],[description]) VALUES (N'role_staff',N'staff',N'Nhân viên nhà xe');

ALTER TABLE [dbo].[CompanyMembership] ALTER COLUMN [role] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[CompanyMembership] ADD CONSTRAINT [CompanyMembership_role_fkey]
 FOREIGN KEY ([role]) REFERENCES [dbo].[Role]([name]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[CompanyMembership] ADD CONSTRAINT [CompanyMembership_operational_role_check]
 CHECK ([role] IN (N'owner', N'manager', N'staff'));
ALTER TABLE [dbo].[BusCompany] ADD [website] NVARCHAR(500) NULL;
ALTER TABLE [dbo].[Bus] ADD [image] NVARCHAR(1000) NULL, [imageSourceUrl] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[Trip] ADD [sourceUrl] NVARCHAR(1000) NULL,
 [isDemo] BIT NOT NULL CONSTRAINT [Trip_isDemo_df] DEFAULT 0;

COMMIT TRAN;
END TRY
BEGIN CATCH
 IF @@TRANCOUNT > 0 ROLLBACK TRAN;
 THROW;
END CATCH;
