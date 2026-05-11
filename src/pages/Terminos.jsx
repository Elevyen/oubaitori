import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import '../styles/terminos.css';

export default function TermsPage() {
    const navigate = useNavigate();

    return (
        <main className="terms-page" aria-labelledby="terms-title">
            <Card className="terms-card">
                <header className="terms-card-header">
                    <h1 id="terms-title">
                        Términos y Política de Privacidad
                    </h1>
                </header>

                <div
                    className="terms-content"
                    role="region"
                    aria-label="Contenido legal y política de privacidad"
                >
                    <section className="tfg-disclaimer-section">
                        <h2>Aviso legal importante</h2>

                        <p>
                            <strong>
                                Oubaitori es un proyecto académico desarrollado
                                como Trabajo de Fin de Grado (TFG) de CFGS en
                                Desarrollo de Aplicaciones Web para el centro FOC.
                            </strong>
                        </p>

                        <p>
                            La plataforma se encuentra en evolución constante y
                            se ofrece sin fines comerciales, con el objetivo de
                            proporcionar un espacio privado de registro y
                            reflexión personal.
                        </p>

                        <p>
                            El uso de la aplicación implica la aceptación de
                            estos términos y el entendimiento de que determinadas
                            funcionalidades pueden modificarse, actualizarse o
                            interrumpirse durante el desarrollo del proyecto.
                        </p>
                    </section>

                    <section>
                        <h2>1. Objeto del servicio</h2>

                        <p>
                            <strong>Oubaitori</strong> es una aplicación orientada
                            al registro emocional y la escritura reflexiva.
                            Permite guardar emociones, notas personales,
                            estados de ánimo y otros contenidos relacionados
                            con el seguimiento personal del usuario.
                        </p>

                        <p>
                            El objetivo de la plataforma es ofrecer un espacio
                            privado y tranquilo para fomentar la autoexpresión,
                            la reflexión y la organización personal mediante
                            diarios y registros individuales.
                        </p>
                    </section>

                    <section>
                        <h2>2. Acceso y uso de la plataforma</h2>

                        <p>
                            Para utilizar determinadas funcionalidades es
                            necesario crear una cuenta. El usuario es
                            responsable de mantener la confidencialidad de sus
                            credenciales y de cualquier actividad realizada
                            desde su cuenta.
                        </p>

                        <p>
                            Las contraseñas no se almacenan en texto plano y
                            son tratadas mediante mecanismos de protección
                            adecuados.
                        </p>

                        <p>
                            No está permitido:
                        </p>

                        <ul>
                            <li>Suplantar la identidad de otras personas.</li>
                            <li>Automatizar la creación masiva de cuentas.</li>
                            <li>Intentar vulnerar la seguridad del sistema.</li>
                            <li>
                                Utilizar la plataforma con fines ilícitos o abusivos.
                            </li>
                        </ul>

                        <p>
                            Oubaitori podrá limitar o suspender cuentas que
                            comprometan la estabilidad, seguridad o correcto
                            funcionamiento del servicio.
                        </p>
                    </section>

                    <section>
                        <h2>3. Privacidad y seguridad</h2>

                        <p>
                            Oubaitori está orientado al almacenamiento de
                            información personal y registros privados creados
                            por el usuario.
                        </p>

                        <p>
                            Parte del contenido almacenado puede incluir
                            información sensible relacionada con emociones,
                            experiencias personales o reflexiones íntimas.
                            Por ello, la plataforma aplica medidas técnicas
                            razonables de seguridad, incluyendo mecanismos
                            de cifrado y control de acceso.
                        </p>

                        <p>
                            Aun así, ningún sistema digital puede garantizar
                            seguridad absoluta, disponibilidad permanente
                            o ausencia total de fallos.
                        </p>

                        <p>
                            El contenido almacenado pertenece exclusivamente
                            al usuario y no se vende, comparte ni utiliza
                            con fines publicitarios o comerciales.
                        </p>

                        <p>
                            Los datos podrán utilizarse únicamente para:
                        </p>

                        <ul>
                            <li>
                                Permitir el funcionamiento técnico del servicio.
                            </li>
                            <li>
                                Resolver incidencias o problemas de seguridad.
                            </li>
                            <li>
                                Mejorar la estabilidad y experiencia de uso.
                            </li>
                            <li>
                                Generar métricas anónimas de uso general.
                            </li>
                        </ul>

                        <p>
                            En circunstancias excepcionales relacionadas con
                            incidencias técnicas críticas o requerimientos
                            legales, podría ser necesario acceder a determinada
                            información almacenada.
                        </p>

                        <p>
                            Se recomienda no almacenar contraseñas, datos
                            bancarios, documentos oficiales o información
                            extremadamente sensible dentro de la plataforma.
                        </p>

                        <p>
                            El usuario puede solicitar la eliminación de su
                            cuenta y de los datos asociados, salvo aquellos
                            que deban conservarse por obligación legal.
                        </p>
                    </section>

                    <section>
                        <h2>4. Uso responsable y bienestar personal</h2>

                        <p>
                            Oubaitori es una herramienta de apoyo personal y
                            organización emocional, pero no sustituye atención
                            médica, psicológica o psiquiátrica profesional.
                        </p>

                        <p>
                            Si el usuario atraviesa una situación de crisis,
                            ansiedad severa o cualquier circunstancia que
                            requiera atención urgente, se recomienda acudir
                            a profesionales especializados o servicios de
                            emergencia correspondientes.
                        </p>
                    </section>

                    <section>
                        <h2>5. Disponibilidad y limitación de responsabilidad</h2>

                        <p>
                            Debido a la naturaleza académica y en desarrollo
                            del proyecto, Oubaitori puede experimentar
                            interrupciones, errores, mantenimientos temporales
                            o cambios en sus funcionalidades.
                        </p>

                        <p>
                            Aunque se aplican medidas razonables para proteger
                            la información y mantener la estabilidad del
                            servicio, no se garantiza disponibilidad
                            ininterrumpida ni ausencia total de fallos.
                        </p>

                        <p>
                            En la máxima medida permitida por la legislación
                            aplicable, Oubaitori y su desarrollador no serán
                            responsables de:
                        </p>

                        <ul>
                            <li>Pérdida accidental de información.</li>
                            <li>Interrupciones temporales del servicio.</li>
                            <li>
                                Accesos no autorizados causados por terceros.
                            </li>
                            <li>
                                Daños indirectos derivados del uso de la plataforma.
                            </li>
                        </ul>

                        <p>
                            Se recomienda conservar copias externas de la
                            información que el usuario considere especialmente
                            importante.
                        </p>
                    </section>

                    <section>
                        <h2>6. Propiedad intelectual</h2>

                        <p>
                            El diseño, nombre, identidad visual y código de
                            <strong> Oubaitori </strong>
                            pertenecen a su desarrollador, salvo que se indique
                            lo contrario.
                        </p>

                        <p>
                            El contenido generado y almacenado por cada usuario
                            sigue siendo propiedad exclusiva del propio usuario.
                        </p>
                    </section>

                    <section>
                        <h2>7. Modificaciones de los términos</h2>

                        <p>
                            Estos términos podrán actualizarse para reflejar
                            cambios técnicos, legales o funcionales del proyecto.
                        </p>

                        <p>
                            La fecha de última actualización se mostrará al
                            final del documento. El uso continuado de la
                            aplicación tras dichas modificaciones implicará
                            la aceptación de los nuevos términos.
                        </p>
                    </section>

                    <section>
                        <h2>8. Contacto y soporte</h2>

                        <p>
                            Si tienes dudas relacionadas con privacidad,
                            seguridad, funcionamiento del proyecto o eliminación
                            de datos, puedes contactar a través de:
                        </p>

                        <p>
                            <strong>
                                <button
                                    type="button"
                                    className="mailto-link contact-link-button"
                                    onClick={() => navigate('/contacto')}
                                >
                                    Ir a contacto
                                </button>
                            </strong>
                        </p>
                    </section>
                </div>

                <footer className="terms-footer">
                    <div className="terms-footer-meta">
                        <small>
                            Última actualización: 11 de mayo de 2026
                        </small>
                    </div>

                    <div className="terms-footer-actions">
                        <button
                            type="button"
                            className="btn-back"
                            onClick={() => navigate('/')}
                            aria-label="Aceptar y volver al inicio"
                        >
                            Aceptar
                        </button>
                    </div>
                </footer>
            </Card>
        </main>
    );
}