import { WebGUIPage } from './app.po';

describe('web-gui App', () => {
  let page: WebGUIPage;

  beforeEach(() => {
    page = new WebGUIPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
