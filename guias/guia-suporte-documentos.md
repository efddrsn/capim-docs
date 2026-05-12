# 📘 Guia de Suporte: Documentos

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. O módulo está disponível para todas as clínicas, sem gating de plano. ✅ Validar.

## 1. 🎯 Visão geral

Documentos é a "papelada" digital do consultório. É a tela onde o dentista (ou a recepção) gera, em PDF, os papéis que o paciente leva embora da consulta: receituário de medicamento, atestado, documento livre escrito a partir de um modelo e qualquer outro arquivo que a clínica queira anexar à ficha (foto, exame em PDF, escaneamento de RG). Resolve três coisas no dia a dia: padronizar o que é entregue ao paciente, guardar histórico do que foi emitido e oferecer assinatura digital quando o documento precisa de validade jurídica.

**Tipos de documento que o sistema gera nativamente:**

* 📝 **Documento customizado** (`CustomDocument`): texto livre criado a partir de um modelo da clínica, com variáveis dinâmicas (nome do paciente, CRO do dentista etc.). É o "tudo-que-não-é-receita-nem-atestado": termo de consentimento, declaração de comparecimento, recibo escrito, ofício.
* 💊 **Receituário** (`Prescription`): lista de medicamentos com posologia, com opção de receita comum ou receita controlada (campo "Esta receita requer receituário especial" no item do medicamento).
* 🏥 **Atestado / Nota do dentista** (`SickNote`): atestado de comparecimento ou afastamento, em dias ou em horas, com CID opcional.
* 📂 **Upload de arquivo** (`UploadFile`): a clínica sobe um PDF/imagem/Word que o próprio paciente trouxe ou que foi gerado fora do sistema.

Existem ainda dois tipos que **aparecem na listagem mas são gerados por outros módulos**, não por aqui: `Anamnesis` (vem do módulo de Anamnese) e `Budget`/`Receipt` (vêm do módulo Financeiro). O suporte vê esses na mesma tabela de Documentos, mas eles **não são criados pelo botão "Novo" do módulo Documentos**.

**Para quem é:** todas as clínicas cliente da Capim. Não há gating de plano nem feature flag para o módulo Documentos em si.

**Onde se encaixa no produto Capim:** liga em Pacientes (cada documento aponta para uma ficha), em Configurações → Documentos (onde ficam os modelos editáveis), em Configurações → Receituário (onde liga/desliga a lista padrão de medicamentos da Capim) e na Assinatura digital (fluxo separado, mas disparado de dentro da tabela de Documentos).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Pelo menos um paciente cadastrado.
* Para emissão pelo dentista que vai assinar: o usuário dentista precisa ter o CRO e o estado do CRO preenchidos no perfil. Sem isso, o documento sai sem rodapé de assinatura do profissional.
* Para receituário: a clínica decide em Configurações → Receituário se a "lista padrão de medicamentos da Capim" vem incluída no seletor (`standard_medicines_included`). Se desligado, só aparecem os medicamentos que a clínica cadastrou.
* Para enviar para assinatura digital: o paciente precisa ter celular válido (envio do link é via WhatsApp) e/ou e-mail, conforme o tipo de assinante escolhido. ✅ Validar canais ativos por tipo de assinante.

**Onde acessar:**

* Menu lateral → **Documentos**. URL: `/#/documents`.
* Dentro de uma ficha de paciente → aba **Documentos**. URL: `/#/patients/:id/documents`.
* As duas telas mostram a mesma tabela, mas a primeira lista de todas as clínicas/pacientes e a segunda filtra automaticamente pelo paciente da ficha.

**Fluxo típico (gerar um documento customizado a partir de modelo):**

1. Em Documentos, clicar no botão "+ Novo" (azul, no canto superior direito) → "Documentos" → "Documento customizado". URL direta: `/#/documents/custom`.
2. Buscar e selecionar o **paciente** (se a tela foi aberta de dentro da ficha, já vem preenchido).
3. Selecionar o **dentista** (opcional, mas obrigatório se quiser marcar a assinatura do dentista).
4. Definir um **título** para o documento.
5. Clicar em **"Selecionar modelo"**: aparece a lista de modelos cadastrados em Configurações → Documentos. O conteúdo do modelo carrega no editor.
6. Editar o texto livremente no editor rich text. Pode usar o botão **"Inserir parâmetro"** (drawer lateral) para colar tags dinâmicas do tipo `#nomepaciente#`, `#cpfpaciente#`, `#nomeprofissional#`, `#croprofissional#`, `#nameclinica#` etc. As tags são substituídas no momento de gerar o PDF.
7. Marcar os checkboxes opcionais: **Cabeçalho padrão** (logo e dados da clínica no topo), **Assinatura do dentista**, **Assinatura do paciente**, **Assinatura do responsável** (esse só fica habilitado se o paciente tem responsável legal cadastrado).
8. Ligar o toggle **"Visualizar com dados"** para ver o documento com as variáveis já substituídas antes de salvar (preview).
9. **"Gerar documento"** salva e o documento aparece na tabela de Documentos. Opcionalmente, **"Salvar como modelo"** salva o que você acabou de escrever como um novo modelo reutilizável (abre modal pedindo o nome do modelo).

**Fluxo típico (gerar receituário):**

1. "+ Novo" → "Documentos" → "Receituário". URL: `/#/documents/prescription`.
2. Selecionar paciente, dentista e data de emissão.
3. Clicar em **"Adicionar medicamento"** (drawer): buscar pelo nome no seletor de medicamentos. Marcar **"Esta receita requer receituário especial"** se for medicamento controlado.
4. Preencher quantidade, unidade de medida e posologia. Salvar o item.
5. Repetir para cada medicamento. A lista aparece na tela.
6. **"Gerar receituário"** cria a prescrição. Se houver mistura de medicamentos comuns e controlados, o sistema separa em duas folhas no PDF (uma de receita comum, outra de receita especial).

**Fluxo típico (gerar atestado / nota do dentista):**

1. "+ Novo" → "Documentos" → "Atestado". URL: `/#/documents/dentist-note`.
2. Selecionar paciente, dentista e data de emissão.
3. Escolher o tipo: **Dias** (atestado de afastamento, define quantidade de dias) ou **Horas** (declaração de comparecimento, define horário de início e fim).
4. Opcional: selecionar **CID** (lista de doenças com código).
5. Marcar **"Incluir assinatura do dentista"** se quiser rodapé com nome e CRO.
6. **"Gerar atestado"**. O documento aparece na tabela.

**Fluxo típico (subir um arquivo da máquina):**

1. "+ Novo" → "Upload de arquivo".
2. Abre drawer com seletor de arquivo. Aceita: `.pdf, .jpg, .jpeg, .png, .txt, .tif, .tiff, .docx, .doc` e binário (`.octet-stream`). **Tamanho máximo de 10 MB por arquivo.**
3. Escolher paciente, opcionalmente uma pasta da ficha do paciente, e dar nome.
4. Salvar. O arquivo entra na tabela como tipo "Upload de arquivo".

**Fluxo típico (enviar para assinatura digital):**

1. Na tabela de Documentos, cada linha tem um **botão de envio** (ícone de avião de papel) à direita. Esse botão só fica habilitado para `CustomDocument`, `Prescription` e `SickNote` (os tipos "assináveis" hoje).
2. Clicar abre o modal **"Solicitar assinatura"**. Para documento customizado, o modal pergunta quem vai assinar: **Paciente**, **Dentista (User)** ou ambos. Para receituário e atestado, só o dentista assina.
3. Próxima etapa: preencher dados do(s) assinante(s) (CPF, e o profissional precisa de registro CRO).
4. **No caso de receituário, abre uma etapa extra de "Certificado"**: o sistema pergunta sobre o certificado digital ICP-Brasil (com certificado, local ou nuvem). Receituário é o único tipo que exige certificado, porque é prescrição médica. Outros tipos vão "sem certificado".
5. Confirmar. O sistema gera o PDF assinável e dispara o job de assinatura. O status do documento na tabela passa por: **Não enviado → Gerando assinatura → Aguardando assinatura → Assinado** (ou **Erro**, **Cancelado**, **Recusado**).
6. Quando o link está pronto, abre modal **"Enviar para assinatura"**: dá pra **enviar por WhatsApp** (botão monta mensagem com link, abre WhatsApp do paciente) ou **abrir o link** em nova aba (para o profissional assinar ali na hora ou copiar e mandar por outro canal).
7. Quando todos os assinantes assinarem, o status vira "Assinado" (verde) e o botão de envio vira **botão de download**: baixa o PDF assinado direto.

**Estados de assinatura que aparecem na coluna "Status da assinatura":**

* 🔵 **Assinatura não solicitada** (`signatureNotRequested`): documento foi gerado mas nunca foi mandado pra assinatura.
* 🟡 **Gerando assinatura** (`generatingSignature`): o backend está montando o pacote, ainda não tem link.
* 🟡 **Aguardando assinatura** (`awaitingPatientSignature` / `partiallySigned`): link disponível, aguardando o assinante clicar e assinar.
* 🟢 **Assinado** (`patientSigned`): todos os assinantes assinaram. PDF assinado disponível pra download.
* 🔴 **Erro na assinatura** (`signatureError`): falha de geração ou envio. Botão de envio fica em estado de erro e permite **tentar de novo** (gera um novo signed_document por cima).
* 🔴 **Cancelada** (`signatureCanceled`).
* 🔴 **Recusada** (`refused`): o assinante abriu o link e recusou.
* ⚪ **Indisponível**: para tipos que não são assináveis hoje (anamnese, upload, recibo, orçamento). Aparece como tag cinza "Indisponível".

**⚠️ Atenção:**

* O **modelo é o esqueleto, o documento gerado é a fotografia**. Editar um modelo depois **não muda os documentos já gerados**. Cada documento custom é uma cópia independente.
* **Modelos marcados como `default` (padrão da Capim) não podem ser deletados** pela tela: o botão "Excluir" só aparece para modelos criados pela clínica.
* **Receituário exige certificado digital ICP-Brasil para assinatura**, por regulação. Os outros tipos assinam "sem certificado" (assinatura eletrônica simples).
* **Documentos da tabela que vieram de outros módulos** (anamnese, orçamento, recibo) aparecem na lista mas **não dá pra deletar pelo dropdown de ações** no caso de recibo (`isReceipt`), e o caminho de assinatura é diferente. Para esses, o melhor é abrir o módulo de origem (botão "Abrir local de origem" no dropdown da linha).
* **Atestado (sick note) e receituário não têm botão de "Editar"** na interface. Erro de digitação? Cancela/deleta e gera de novo.
* **Documentos customizados também não têm "Editar"** depois de criados. O conteúdo é gravado como HTML final.
* **Tamanho máximo de upload é 10 MB** por arquivo. Tentar subir um PDF maior vai falhar na hora do upload.

## > 3. 💼 Casos de uso esperados

* **Caso 1, receituário pós-extração:** dentista termina o procedimento, abre a ficha do paciente, vai em Documentos → "+ Novo" → Receituário. Seleciona dipirona e amoxicilina (ambas comuns), define posologia, gera. PDF abre numa nova aba pra imprimir. Se houver dor mais forte, marca a opção "receituário especial" no medicamento controlado e a Capim separa em duas folhas no PDF.
* **Caso 2, atestado de afastamento:** paciente pediu atestado de 2 dias pós-cirurgia. Dentista vai em "+ Novo" → Atestado, escolhe tipo "Dias", coloca 2, opcionalmente seleciona o CID, marca "incluir assinatura do dentista" e gera. PDF sai pronto pra imprimir e assinar à caneta, ou pode ser enviado para assinatura digital.
* **Caso 3, termo de consentimento para procedimento:** a clínica criou em Configurações → Documentos → Modelos um modelo "Termo de Consentimento para Cirurgia" com variáveis (`#nomepaciente#`, `#cpfpaciente#`, `#nomeprofissional#`). Antes da cirurgia, abre Documento Customizado, seleciona o modelo, o sistema preenche as variáveis, marca **assinatura do paciente** e envia para assinatura digital via WhatsApp. O paciente assina pelo celular antes do procedimento.
* **Caso 4, declaração de comparecimento pra empresa:** paciente pede declaração que ficou no consultório das 14h às 16h. Dentista vai em Atestado, escolhe tipo "Horas", define 14:00–16:00 e gera.
* **Caso 5, anexar exame de imagem na ficha:** paciente trouxe radiografia em PDF de outra clínica. Recepção abre a ficha → Documentos → "+ Novo" → "Upload de arquivo", sobe o PDF, define nome "Radiografia panorâmica 03/2026". Fica anexado na ficha pra consulta futura.
* **Caso 6, recibo / orçamento aparece na tabela:** o paciente fechou um orçamento. Esse orçamento aparece na aba Documentos da ficha como tipo "Orçamento" porque o sistema unificou tudo aqui. O botão de envio para assinatura funciona, mas o caminho do orçamento tem status próprio (`generating_external_document`, `waiting_for_signature`, `signed`). Para editar, é necessário voltar ao módulo Financeiro/Orçamentos.

## > 4. ❓ FAQ

**P: A clínica criou um modelo, salvou, mas ele não aparece na lista quando vai gerar documento customizado. O que pode ser?**

R: O seletor de modelos do "Novo documento customizado" busca de `/v1/document_templates`, que retorna **modelos padrão da Capim + modelos da clínica**. Se o modelo foi salvo (botão "Salvar como modelo" no editor, ou pela tela Configurações → Documentos → Modelos), ele aparece. Conferir: (1) se realmente apareceu na lista em Configurações → Documentos → Modelos. Se sim e mesmo assim não aparece no seletor, pedir F5 na tela. (2) Se o nome digitado no salvar foi gravado mesmo (o modal exige nome não vazio). ✅ Validar se há cache local de modelos no frontend que possa estar segurando uma lista antiga.

**P: Editei um modelo no Configurações. Os documentos antigos vão mudar também?**

R: Não. Cada documento gerado é uma cópia independente do conteúdo. Editar o modelo só afeta documentos novos criados a partir dele dali pra frente.

**P: Por que não consigo deletar o modelo X?**

R: Provavelmente é um **modelo padrão da Capim** (`default: true`). A tabela só mostra o botão "Excluir" para modelos criados pela clínica. Modelos padrão são gerenciados pelo time da Capim e a clínica não pode apagar.

**P: O dentista digitou errado no atestado. Como corrige?**

R: Não dá pra editar pela tela. O caminho é abrir a tabela de Documentos, clicar nos três pontinhos da linha, **"Excluir"** o atestado e **gerar um novo** com o texto certo. O backend faz `discard!` (soft delete), então o documento errado fica no banco mas some da tabela.

**P: O paciente disse que não recebeu o link de assinatura no WhatsApp. O que verificar?**

R: Em ordem: (1) o cadastro do paciente tem celular válido? (2) o documento está em status "Aguardando assinatura"? Se está em "Gerando", o link ainda não saiu, pedir pra esperar (a tela atualiza por websocket). (3) Reabrir o documento na tabela → botão de envio (avião de papel) → modal "Enviar para assinatura" → **clicar em "Enviar pelo WhatsApp"** de novo. Esse botão monta a mensagem com o link e abre o WhatsApp Web/app do operador, **não envia automaticamente**: quem aperta enviar é o atendente. (4) Se o status ficou em "Erro na assinatura", o documento precisa ser gerado de novo (clicar no botão de envio com o ícone de alerta abre o fluxo de recriar).

**P: Documento foi pra "Erro na assinatura". E agora?**

R: O botão de envio do documento vira ícone de alerta. Clicar reabre o modal de "Solicitar assinatura" e, para sick note e prescription, o backend já trata como um `updateSignedDocument` (atualiza o pacote em vez de criar novo). Para documento custom, gera um novo. Se persistir o erro depois de tentar de novo, escalar.

**P: Tem assinatura ICP-Brasil de verdade?**

R: Para **receituário**, sim: o fluxo tem uma etapa extra de "Certificado" e o backend manda `auth: 'with_certificate'`. Para os outros tipos (custom document, atestado), a assinatura é eletrônica simples (`without_certificate`). ✅ Validar com produto qual provedor é usado e qual a validade jurídica de cada modalidade.

**P: Como o paciente vê e assina?**

R: O link mandado via WhatsApp (ou aberto em nova aba) leva pra uma tela do próprio domínio da Capim onde o assinante confirma os dados (CPF) e assina. Para dentista assinar com certificado (receituário), o link puxa o certificado local (instalado no navegador) ou em nuvem. ✅ Validar fluxo exato do lado do paciente.

**P: Onde a clínica encontra o histórico de tudo que já foi gerado pra um paciente?**

R: Ficha do paciente → aba **Documentos**. Mostra a mesma tabela do menu Documentos só que filtrada pelo paciente, com tipo, data, título, status de assinatura e ações (preview, download, deletar).

**P: Receituário comum e controlado saem juntos no mesmo PDF?**

R: Não. Quando a receita tem itens marcados como "receituário especial" misturados com itens comuns, o sistema **gera duas folhas separadas**: uma de receita comum e outra de receita especial. A tela já lida com isso, o dentista só marca cada medicamento como especial ou não.

**P: Dá pra enviar o documento por e-mail em vez de WhatsApp?**

R: Pelo modal de envio para assinatura, **a interface oferece apenas "WhatsApp" e "Abrir link"**. Não há botão de envio por e-mail no fluxo de assinatura. Quem precisa mandar por e-mail abre o link e copia/cola manualmente. ✅ Validar se há fluxo de envio por e-mail em algum outro canto do produto.

**P: Como funciona o cabeçalho padrão do documento customizado?**

R: O checkbox **"Cabeçalho padrão"** no formulário inclui o cabeçalho da clínica (logo + nome + dados de contato) no topo do PDF gerado. O logo e os dados vêm da configuração da clínica em Configurações → Clínica. Se a clínica não tem logo cadastrado, o cabeçalho sai só com texto.

**P: A lista padrão de medicamentos da Capim vem habilitada?**

R: Depende da configuração da clínica em **Configurações → Receituário**. O toggle `standard_medicines_included` decide se o seletor de medicamentos mostra a lista pré-cadastrada da Capim ou apenas os medicamentos que a clínica cadastrou. 🚧 PENDENTE: confirmar o default (vem ligado ou desligado para clínicas novas?).

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o dentista relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo gerar o documento, o botão 'Gerar' fica cinza." | Algum campo obrigatório vazio: paciente, título (no custom), data (no receituário/atestado), ou no caso do receituário, lista de medicamentos vazia. | Pedir print da tela. Conferir se paciente foi selecionado, se há pelo menos um medicamento (receituário), se a data está preenchida. No custom, exigir título e conteúdo não vazios. | Se todos os campos estão preenchidos e mesmo assim trava, escalar com print e ID da clínica. |
| "Salvei o modelo mas não aparece pra selecionar." | Cache de seletor ou o modelo foi salvo em outro contexto. | Pedir F5. Validar em Configurações → Documentos → Modelos se o modelo está mesmo lá. | Se está lá e o seletor não busca, escalar pra eng. |
| "O documento saiu sem cabeçalho da clínica." | O checkbox "Cabeçalho padrão" não foi marcado, **ou** a clínica não tem logo/dados completos em Configurações → Clínica. | Pedir pra gerar de novo marcando "Cabeçalho padrão". Conferir Configurações → Clínica (nome, endereço, telefone, logo). | Se mesmo com tudo preenchido o cabeçalho não sai, escalar com ID da clínica e ID do documento. |
| "O documento saiu com `#nomepaciente#` em vez do nome." | A tag não foi reconhecida (digitação errada da tag ou modelo antigo com tag em formato não suportado). | Conferir as tags válidas no drawer "Inserir parâmetro": elas precisam estar exatamente como `#nomepaciente#`, `#cpfpaciente#`, `#nomeprofissional#`, `#croprofissional#`, `#nameclinica#`, `#cnpjclinica#` etc. Tag fora dessa lista não é substituída. Editar o modelo, salvar e gerar de novo. | Se a tag existe na lista mas não substitui, escalar com print do modelo e ID do documento. |
| "O upload de arquivo dá erro." | Tipo de arquivo fora do permitido, ou arquivo maior que 10 MB. | Conferir extensão: aceita `.pdf, .jpg, .jpeg, .png, .txt, .tif, .tiff, .docx, .doc` e binário. Conferir tamanho (limite de 10 MB). Pedir pra compactar/converter. | Se está dentro das regras e ainda falha, escalar com nome e tamanho do arquivo. |
| "Mandei o documento pra assinatura há horas e está 'Gerando'." | Job de geração travou ou falhou silenciosamente. | A tela atualiza por websocket; pedir F5 pra forçar refresh. Se segue "Gerando" mais de alguns minutos, é fila travada. | Escalar pra eng com ID do documento e ID do signed_document. |
| "Status virou 'Erro na assinatura'." | Falha na geração do pacote de assinatura (provedor externo ou problema de dados do assinante). | Clicar no botão de envio (ícone de alerta) abre o fluxo de tentar de novo. Para sick note e prescription, o backend usa `update`; para custom, recria. Se na segunda tentativa funcionar, ok. | Se persistir, escalar com ID do documento, tipo, e print do erro. |
| "O paciente assinou pelo link mas a clínica continua vendo 'Aguardando'." | Webhook do provedor de assinatura demorou, ou só um de dois assinantes assinou (status `partiallySigned`). | Conferir na coluna "Assinantes" se aparece o ícone de check para cada assinante. Se for `partiallySigned`, está esperando o segundo. Pedir F5 / esperar alguns minutos. | Se passou tempo e está claro que todos assinaram mas o status não muda, escalar. |
| "Não consigo deletar o modelo." | Modelo é padrão da Capim (`default: true`). | Explicar que modelos padrão não são deletáveis pela tela. Sugerir criar uma cópia editada como novo modelo da clínica. | Não escalar (comportamento esperado). |
| "Atestado/Receituário sumiu da lista mas eu queria de volta." | Foi feito `discard!` (soft delete). | Explicar que pela interface não há "lixeira" / restaurar. Gerar de novo é o caminho prático. Se for crítico (foi assinado e perdido), pedir reativação para a engenharia (registro fica no banco). | Escalar pra eng com ID do documento se a clínica precisar restaurar. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Bug de geração de PDF, falha de assinatura digital, restauração de documento deletado: todos entram por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Não dá pra editar documento gerado.** Custom, receituário e atestado: depois de gerados, não têm botão "Editar". O caminho é deletar e gerar de novo. Para `UploadFile` existe "Editar" (renomear, mover pasta).
* **Editar modelo não retroage** para documentos já gerados.
* **Modelos padrão da Capim não são deletáveis** pela clínica.
* **Envio para assinatura digital cobre só três tipos**: documento customizado, receituário e atestado. Anamnese, orçamento e upload têm fluxos separados; o botão de envio na tabela é genérico mas o caminho real é módulo a módulo.
* **Envio do link de assinatura é via WhatsApp ou link copiado.** Não existe botão de envio por e-mail no fluxo de assinatura.
* **WhatsApp não envia sozinho:** o botão "Enviar pelo WhatsApp" monta a mensagem e abre o WhatsApp do operador. Quem clica em "enviar" é o atendente, do próprio aparelho/Web.
* **Tamanho máximo de upload: 10 MB.** Sem opção de subir arquivo maior pela interface.
* **Pré-visualização nem sempre funciona pra todos os formatos.** Para `.pdf`, `.txt`, `.doc`, `.docx`, o sistema usa Google Docs Viewer (`GVIEW_URL`); se a integração estiver fora do ar, o preview falha mas o download segue funcionando.
* **Receituário controlado:** marcação é por medicamento (`special_prescription_required`), não por receita. Não é possível misturar manualmente a folha de cada um, mas o sistema separa automaticamente no PDF.
* **Atestado em horas:** o range `start_date`/`end_date` é montado no frontend juntando data + horário. Se a clínica está com fuso errado em Configurações, o atestado sai com horários trocados.

## > 7. 🗺️ Próximos passos [opcional]

* Edição de documento já gerado (hoje é deletar e refazer). 🚧 PENDENTE: confirmar se está no roadmap.
* Envio por e-mail no fluxo de assinatura. 🚧 PENDENTE.
* Suporte a assinatura digital de mais tipos (anamnese tem caminho próprio; orçamento idem). 🚧 PENDENTE: clareza de unificação.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: tabela de Documentos com colunas Data, Título, Paciente, Tipo, Assinantes, Status da assinatura, Ações]

[INSERIR PRINT: dropdown "+ Novo" com as opções Upload, Documento customizado, Receituário, Atestado]

[INSERIR PRINT: tela de Documento Customizado com editor rich text e drawer "Inserir parâmetro" aberto]

[INSERIR PRINT: tela de Receituário com lista de medicamentos e drawer de novo medicamento aberto, mostrando o checkbox "receituário especial"]

[INSERIR PRINT: tela de Atestado com os toggles Dias / Horas]

[INSERIR PRINT: modal "Solicitar assinatura" na etapa de selecionar assinantes (Paciente / Dentista)]

[INSERIR PRINT: etapa extra de Certificado ICP-Brasil no fluxo de receituário]

[INSERIR PRINT: modal "Enviar para assinatura" com botões "Enviar pelo WhatsApp" e "Abrir link"]

[INSERIR PRINT: Configurações → Documentos → Modelos, com a tabela de modelos da clínica e o botão de excluir só nos não-padrão]

[INSERIR PRINT: Configurações → Receituário com o toggle "Incluir lista padrão de medicamentos"]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Modelos e variáveis**
* [ ] Default do toggle `standard_medicines_included` em Configurações → Receituário (vem ligado ou desligado para clínicas novas?).
* [ ] Lista oficial completa de modelos `default` que a Capim entrega pré-cadastrados.
* [ ] Existe cache local de modelos no frontend que possa segurar uma lista antiga depois de salvar um novo?

**Assinatura digital**
* [ ] Provedor de assinatura digital usado (ClickSign? D4Sign? Próprio?) e validade jurídica de cada modalidade (com / sem certificado).
* [ ] Fluxo exato da tela do paciente assinando pelo celular (telas, validações, tempo de expiração do link).
* [ ] Se há limite de quantas vezes pode "tentar de novo" depois de erro de assinatura.
* [ ] Como o suporte consulta o status detalhado de um signed_document específico (logs do provedor) quando o caso vira escalação.

**Envio**
* [ ] Existe envio por e-mail em algum canto do fluxo de assinatura, ou é só WhatsApp/link?
* [ ] Mensagem padrão enviada por WhatsApp pelo botão "Enviar pelo WhatsApp" é configurável pela clínica?

**Operação e correção**
* [ ] Canal oficial para o suporte pedir restauração de documento deletado (sick note, prescription, custom).
* [ ] SLA esperado para resolução de "documento travado em Gerando" no Time de Sustentação.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Módulo Documentos está disponível para todas as clínicas, sem gating de plano." Inferido: nenhuma rota do módulo passa por meta de feature flag.
* [ ] "Receituário é o único tipo que exige certificado digital ICP-Brasil." Confirmado pelo backend (`CreateForm#auth` retorna `with_certificate` apenas para `Prescription`), mas vale validar com produto se isso é regra de negócio definitiva.
* [ ] "Para sick note e prescription, segunda tentativa de assinatura usa `update` (atualiza signed_document existente); para custom, recria." Confirmado no `CreateSignedDocumentModal.vue`, mas validar se o comportamento é intencional ou herança histórica.
* [ ] "Documento customizado não tem edição depois de gerado." Confirmado no `CustomDocumentsController` (só `show`, `create`, `destroy`) e no `DocumentsActionsDropdown` (botão "Editar" só aparece para `UploadFile`). Validar se isso vai mudar.
* [ ] "Receituário com mistura de medicamentos comuns e especiais gera duas folhas separadas no PDF." Inferido pela presença do filtro `medicines_requirement` no controller. Validar geração visualmente.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Tipos assináveis hoje são apenas `CustomDocument`, `Prescription` e `SickNote` (constante `SIGNABLE_DOCUMENTS_INDEX`).
* `DocumentTemplate` com `default: true` não pode ser deletado: o controller retorna `:unprocessable_entity`.
* Receituário usa `auth: 'with_certificate'`, demais tipos usam `'without_certificate'` no job de geração.
* Custom document, sick note e prescription usam `discard!` (soft delete), não apagam do banco.
* Tags dinâmicas suportadas no editor: `nomepaciente`, `datanascimentopaciente`, `cpfpaciente`, `rgpaciente`, `ceppaciente`, `enderecopaciente`, `nomeresponsavelpaciente`, `cpfresponsavelpaciente`, `razaosocialclinica`, `nameclinica`, `cnpjclinica`, `telefoneclinica`, `emailclinica`, `cepclinica`, `enderecoclinica`, `cidadeestadoclinica`, `nomeprofissional`, `croprofissional`.
* Tamanho máximo de upload de arquivo: 10 MB; extensões aceitas conforme `ALLOWED_FILE_TYPES`.
* Filtros disponíveis na listagem: `order_by`, `search_term`, `start_date`, `end_date`, `sort`, `type[]`.
* O botão "Enviar pelo WhatsApp" no modal de assinatura abre o WhatsApp do operador com mensagem pré-montada, não envia automaticamente.
* Atualização em tempo real do status na tabela vem por websocket (`SIGNED_DOCUMENT_UPDATED_CHANNEL`).
