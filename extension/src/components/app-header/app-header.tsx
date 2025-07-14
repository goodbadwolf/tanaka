import { ActionIcon, Group, Paper, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-preact';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import './app-header.scss';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
  loading?: boolean;
  withBorder?: boolean;
  isMainHeader?: boolean;
  ariaLabel?: string;
}

export function AppHeader(props: AppHeaderProps) {
  const {
    title,
    subtitle,
    icon,
    actions,
    onBack,
    variant = 'default',
    className = '',
    loading = false,
    withBorder = true,
    isMainHeader = false,
    ariaLabel,
  } = props;

  const padding = variant === 'compact' ? 'sm' : variant === 'prominent' ? 'xl' : 'lg';
  const titleOrder = variant === 'prominent' ? 1 : variant === 'compact' ? 3 : 2;
  const iconSize = variant === 'compact' ? 'md' : 'lg';
  const shadow = variant === 'prominent' ? 'md' : 'sm';

  return (
    <Paper
      component="header"
      className={clsx('tnk-app-header', `tnk-app-header--${variant}`, className)}
      shadow={shadow}
      p={padding}
      radius={0}
      withBorder={withBorder}
      aria-label={ariaLabel || `${title} header`}
      role={isMainHeader ? 'banner' : undefined}
    >
      <div className="tnk-app-header__main">
        <Group className="tnk-app-header__content" gap="md" wrap="nowrap">
          {onBack && (
            <ActionIcon
              className="tnk-app-header__back"
              variant={variant === 'prominent' ? 'white' : 'subtle'}
              color={variant === 'prominent' ? 'dark' : undefined}
              size={iconSize}
              onClick={onBack}
              aria-label="Go back"
              loading={loading}
              radius="md"
            >
              <IconArrowLeft size={iconSize === 'md' ? 18 : 20} />
            </ActionIcon>
          )}

          {icon && (
            <div className="tnk-app-header__icon">
              {typeof icon === 'object' && 'type' in icon && icon.type === ThemeIcon ? (
                icon
              ) : (
                <ThemeIcon
                  size={iconSize}
                  variant={variant === 'prominent' ? 'white' : 'filled'}
                  color={variant === 'prominent' ? 'dark' : undefined}
                  radius="md"
                >
                  {icon}
                </ThemeIcon>
              )}
            </div>
          )}

          <div className="tnk-app-header__text">
            <Title order={titleOrder as 1 | 2 | 3} className="tnk-app-header__title" lineClamp={1}>
              {title}
            </Title>

            {subtitle && variant !== 'compact' && (
              <Text
                size="sm"
                c="dimmed"
                className="tnk-app-header__subtitle"
                lineClamp={1}
                component="p"
              >
                {subtitle}
              </Text>
            )}
          </div>
        </Group>

        {actions && (
          <Group
            className="tnk-app-header__actions"
            gap={variant === 'compact' ? 'xs' : 'sm'}
            wrap="nowrap"
          >
            {actions}
          </Group>
        )}
      </div>
    </Paper>
  );
}

AppHeader.displayName = 'AppHeader';
