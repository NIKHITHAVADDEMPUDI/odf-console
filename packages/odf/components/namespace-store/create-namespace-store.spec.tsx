import * as React from 'react';
import { render } from '@testing-library/react';
import CreateNamespaceStore from './create-namespace-store';

const odfNamespace = 'test-ns-1';
const params = {
  ns: 'test-ns',
};

const mockNamespaceStoreForm = jest.fn();
const MockNamespaceStoreForm: React.FC = () => null;
jest.mock('./namespace-store-form', () => (props) => {
  mockNamespaceStoreForm(props);
  return <MockNamespaceStoreForm />;
});

jest.mock('@odf/core/redux', () => ({
  useODFNamespaceSelector: () => ({
    odfNamespace,
    isODFNsLoaded: true,
    odfNsLoadError: null,
    isNsSafe: true,
    isFallbackSafe: true,
  }),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: () => ({
    ns: params.ns,
  }),
  useNavigate: () => null,
}));

describe('CreateNamespaceStore test', () => {
  it('shows the correct heading texts', () => {
    const { container } = render(<CreateNamespaceStore />);
    const heading = container.getElementsByClassName(
      'odf-create-operand__header-text'
    )[0];
    const titleHeading = container.getElementsByClassName('help-block')[0];
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Create NamespaceStore/);
    expect(titleHeading).toBeInTheDocument();
    expect(titleHeading).toHaveTextContent(
      /Represents an underlying storage to be used as read or write target for the data in the namespace buckets\./
    );
  });

  it('Check the title size and heading level', () => {
    const { container } = render(<CreateNamespaceStore />);
    const fontSize = container.getElementsByClassName('pf-m-2xl')[0];
    expect(fontSize).toBeInTheDocument();
    expect(
      container.querySelectorAll('h1.odf-create-operand__header-text')[0]
    ).toBeTruthy();
  });

  it('pass the received namespace to the form', () => {
    render(<CreateNamespaceStore />);
    expect(mockNamespaceStoreForm).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: params.ns,
      })
    );
  });
});
