{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.postgresql
    pkgs.nodePackages.npm
    pkgs.nodePackages.typescript-language-server
    pkgs.nodePackages.yarn
    pkgs.nodePackages.pnpm
  ];
}
