export interface Document {
  id: string;
  title: string;
  moduleCode: string;
  faculty: string;
  type: 'Past Paper' | 'Note' | 'Tutorial' | 'Lecture Note' | 'Research Paper' | 'Thesis';
  uploadedAt: string;
  uploader: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  size?: string;
  format?: string;
  isTopRated?: boolean;
}

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    title: 'SE3020 Final Examination - Paper I',
    moduleCode: 'SE3020',
    faculty: 'Computing',
    type: 'Past Paper',
    uploadedAt: 'Oct 24, 2023',
    uploader: 'Librarian-Team',
    status: 'Approved'
  },
  {
    id: '2',
    title: 'Requirement Analysis & Design Workshop',
    moduleCode: 'SE1010',
    faculty: 'Computing',
    type: 'Tutorial',
    uploadedAt: 'Sep 12, 2023',
    uploader: 'Student-Sub',
    status: 'Pending'
  },
  {
    id: '3',
    title: 'Advanced Algorithms & Complexity Theory',
    moduleCode: 'CS3030',
    faculty: 'Computing',
    type: 'Lecture Note',
    uploadedAt: 'Nov 02, 2023',
    uploader: 'Faculty-Staff',
    status: 'Approved'
  },
  {
    id: '4',
    title: 'Complete Software Engineering Study Kit (2023 Edition)',
    moduleCode: 'SE-KIT',
    faculty: 'Computing',
    type: 'Note',
    uploadedAt: 'Oct 15, 2023',
    uploader: 'Admin',
    status: 'Approved',
    isTopRated: true,
    size: '124.5 MB',
    format: 'PDF/ZIP'
  },
  {
    id: '5',
    title: 'Professional Practice Mid-Term',
    moduleCode: 'SE2012',
    faculty: 'Computing',
    type: 'Past Paper',
    uploadedAt: 'Aug 28, 2023',
    uploader: 'Librarian-Team',
    status: 'Approved'
  }
];
