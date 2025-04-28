import React from 'react';
import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled component for consistent responsive behavior across admin pages
const StyledContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    padding: theme.spacing(1, 2),
  },
  '@media (min-width: 1600px)': { // TV and large screens
    padding: theme.spacing(3, 4),
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  overflow: 'auto',
  height: '100%',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    padding: theme.spacing(2),
  },
  '@media (min-width: 1600px)': { // TV and large screens
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
  }
}));

// Reusable header component with responsive sizing
const ResponsiveHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem',
    marginBottom: theme.spacing(2),
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    fontSize: '1.25rem',
    marginBottom: theme.spacing(1.5),
  },
  '@media (min-width: 1600px)': { // TV and large screens
    fontSize: '2rem',
    marginBottom: theme.spacing(4),
  }
}));

// Component to wrap all admin content pages for consistent responsive behavior
const ResponsiveAdminContainer = ({ title, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTV = useMediaQuery('(min-width: 1600px)');
  
  return (
    <StyledContainer>
      <StyledPaper>
        <ResponsiveHeader variant={isTV ? 'h4' : isMobile ? 'h6' : 'h5'}>
          {title}
        </ResponsiveHeader>
        {children}
      </StyledPaper>
    </StyledContainer>
  );
};

export default ResponsiveAdminContainer; 