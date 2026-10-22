import MainContainer from '../(main)/_components/MainContainer';

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return <MainContainer isPublic>{children}</MainContainer>;
};

export default PublicLayout;
