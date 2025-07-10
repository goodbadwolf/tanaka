import { Paper, Title, Group } from '@mantine/core';
import type { ReactNode } from 'react';
import { ThemeToggle } from '../theme-toggle';
import './page-header.scss';

interface IPageHeaderProps {
  title: string;
  showThemeToggle?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader(props: IPageHeaderProps) {
  const { title, showThemeToggle = true, actions, className = '' } = props;

  return (
    <Paper className={`page-header ${className}`} shadow="sm" p="lg">
      <Title order={2} className="page-header__title">
        {title}
      </Title>

      {(showThemeToggle || actions) && (
        <Group className="page-header__actions" gap="sm">
          {actions}
          {showThemeToggle && <ThemeToggle />}
        </Group>
      )}
    </Paper>
  );
}
