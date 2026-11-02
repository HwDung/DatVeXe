ALTER TABLE [dbo].[PaymentAttempt]
ADD [provider] NVARCHAR(20) NOT NULL
CONSTRAINT [PaymentAttempt_provider_df] DEFAULT 'momo';
