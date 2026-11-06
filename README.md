# Sistema de Vendas para Windows

Aplicativo desktop para Windows baseado no sistema de vendas existente. `sistema-vendas.html` contém a estrutura das telas, `assets/styles.css` os estilos, `renderer/app.js` as regras e interações da aplicação, e os arquivos em `desktop/` a janela Electron e o armazenamento local persistente.

## Requisitos

- Windows 10 ou 11 de 64 bits para executar ou compilar.
- Node.js 22.12 ou superior e npm.
- Conexão com a internet somente para instalar as dependências e gerar a primeira compilação. O uso normal do aplicativo é offline.

## Executar em desenvolvimento

No PowerShell, na pasta do projeto:

```powershell
npm.cmd install
npm.cmd start
```

## Compilar e criar o instalador

```powershell
npm.cmd run build:win
```

O comando gera um instalador NSIS x64 em:

```text
dist\SistemaVendas-Setup-1.0.0-x64.exe
```

O instalador é por usuário, oferece escolha da pasta e cria atalhos no Menu Iniciar e na área de trabalho. Atualizações e desinstalações preservam os dados em `%APPDATA%\Sistema de Vendas`; a desinstalação não remove essa pasta.

O nome do aplicativo, identificador e informações do pacote podem ser ajustados em `package.json`. O ícone padrão é gerado por `npm.cmd run create-icon`; para personalizar, substitua `assets\icon.ico` por um ícone próprio do Windows.

## Dados, backup e migração

O arquivo de dados do aplicativo fica em:

```text
%APPDATA%\Sistema de Vendas\dados-sistema-vendas.json
```

O Electron lê e grava esse arquivo por uma ponte limitada ao armazenamento do sistema. As gravações substituem o arquivo por uma gravação temporária no mesmo diretório. A interface não recebe acesso a caminhos arbitrários, arquivos do computador, Node.js ou APIs nativas irrestritas.

Os dados existentes no navegador não são migrados automaticamente: o armazenamento do navegador e o do aplicativo desktop são locais distintos. No sistema antigo, faça um **Backup completo** em `Backup`, instale e abra o aplicativo e, no primeiro acesso, use **Restaurar backup completo** para importar o arquivo. Faça uma cópia segura antes da restauração; ela substitui os dados atuais.

Na aba `Backup`, também estão disponíveis backups específicos de estoque e faturamento. Arquivos de backup contêm dados comerciais e, no backup completo, credenciais em formato protegido. Guarde-os em local controlado.

Atualizar ou reinstalar o programa não apaga os dados. Faça backups regulares; os dados locais não são sincronizados nem compartilhados entre computadores.

## Impressora e leitor de código de barras

O leitor que funciona como teclado continua compatível. Selecione uma impressora instalada no Windows no diálogo de impressão do comprovante. O aplicativo não instala drivers de impressora.

## Segurança e suporte do Windows

O pacote fixa Electron `45.2.3` e electron-builder `26.18.0`. A dependência de build `minimatch` é fixada em `11.0.5` para evitar as versões apontadas pela auditoria atual. Electron está configurado com `contextIsolation`, `sandbox`, `webSecurity` e `nodeIntegration` desativada. O preload expõe somente leitura e gravação da chave de dados do sistema por IPC validado. A interface ainda usa manipuladores inline existentes, portanto a política de conteúdo permite scripts inline; não são carregados recursos de rede.

O instalador gerado por esta configuração é **somente x64** e destina-se ao Windows 10 e 11 x64. Não foi gerado nem testado um executável x86 ou ARM64.

Windows 7 não é suportado. A compatibilidade com Windows 7 terminou no Electron 23; Electron 22 foi a última linha compatível e encerrou suporte em 10 de outubro de 2023. Usá-la deixa o Chromium e componentes nativos sem correções de segurança atuais, por isso não é oferecida neste projeto. Consulte a [nota de lançamento do Electron 23](https://www.electronjs.org/blog/electron-23-0), a [nota do Electron 22](https://www.electronjs.org/blog/electron-22-0) e a [política de suporte do Electron](https://www.electronjs.org/docs/latest/tutorial/electron-timelines#version-support-policy). A alternativa recomendada é Windows 10/11 x64 atualizado. Compatibilidade de uma compilação com uma instalação específica do Windows 10 deve ser verificada nessa máquina antes da implantação.

O instalador não foi assinado digitalmente. O Windows pode exibir avisos de editor desconhecido; distribuição a terceiros requer certificado de assinatura confiável.
